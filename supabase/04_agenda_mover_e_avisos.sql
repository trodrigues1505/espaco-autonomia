-- ============================================================
-- 04_agenda_mover_e_avisos.sql
--  • avisos_aula: aviso ao aluno quando uma aula em que ele está confirmado é remarcada
--  • agenda_mover_aula(): move UMA aula ("esta") ou a SÉRIE ("serie") — tudo numa transação
--  • agenda_desfazer_mover(): desfaz um movimento (usado pelo botão "Desfazer")
-- Pré-requisitos: 01, 02 e 03 já executados.
--
-- "serie" = esta ocorrência e as próximas da MESMA aula que estão no mesmo dia da semana e
-- horário (ocorrências canceladas ou editadas à mão para outro horário NÃO entram) +
-- o horário-modelo (aulas_horarios) da aula. Passado nunca é alterado.
-- ============================================================

-- ── 1) Avisos ao aluno ──────────────────────────────────────────
create table if not exists public.avisos_aula (
  id             uuid primary key default gen_random_uuid(),
  lote           uuid not null,                       -- agrupa os avisos de uma ação (Desfazer apaga o lote)
  aluno_id       uuid not null references public.perfis(id) on delete cascade,
  ocorrencia_id  uuid references public.ocorrencias(id) on delete set null,
  escopo         text not null check (escopo in ('esta','serie')),
  titulo         text not null,
  corpo          text not null,
  de_data_hora   timestamptz not null,
  para_data_hora timestamptz not null,
  criado_em      timestamptz not null default now()
);
create index if not exists ix_avisos_aula_aluno on public.avisos_aula (aluno_id, criado_em desc);
alter table public.avisos_aula enable row level security;

drop policy if exists "aluno ve proprios avisos" on public.avisos_aula;
create policy "aluno ve proprios avisos" on public.avisos_aula
  for select to authenticated using (aluno_id = auth.uid());
drop policy if exists "admin ve avisos" on public.avisos_aula;
create policy "admin ve avisos" on public.avisos_aula
  for select to authenticated
  using (exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin'));
-- (sem políticas de escrita: só as funções abaixo, que são SECURITY DEFINER, gravam)

-- ── 2) Mover aula / série ───────────────────────────────────────
create or replace function public.agenda_mover_aula(
  p_ocorrencia uuid,
  p_novo       timestamptz,
  p_escopo     text    default 'esta',     -- 'esta' | 'serie'
  p_avisar     boolean default true,       -- cria aviso para os alunos confirmados
  p_confirmado boolean default false       -- true = o admin já confirmou os alertas (feriado/conflito)
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_tz   constant text   := 'America/Sao_Paulo';
  c_dias constant text[] := array['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  c_cod  constant text[] := array['dom','seg','ter','qua','qui','sex','sab'];

  v_uid   uuid := auth.uid();
  o       record;
  a       record;
  v_novo  timestamptz := date_trunc('minute', p_novo);

  v_old_local timestamp;  v_new_local timestamp;
  v_old_dow int;          v_new_dow int;
  v_old_time time;        v_new_time time;
  v_delta int;
  v_sentido int;

  v_n int;                v_conf int;           v_alunos int := 0;   v_n2 int;
  v_avisos text[] := '{}';
  v_nome text;            v_prof text;
  v_fer_n int;            v_fer_nomes text;
  v_cf_n int;             v_cf_ex text;
  v_lote uuid := gen_random_uuid();
  v_modelo jsonb := null; v_modelo_ok boolean := false;
  v_desfazer jsonb;
  v_zap text;             v_primeira timestamptz;
  r record;
begin
  if v_uid is null or not exists (select 1 from public.perfis where id = v_uid and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;
  if p_escopo not in ('esta','serie') then
    raise exception 'Escopo inválido: use esta ou serie' using errcode = '22023';
  end if;

  select * into o from public.ocorrencias where id = p_ocorrencia for update;
  if not found then raise exception 'Aula não encontrada' using errcode = 'P0002'; end if;
  select * into a from public.aulas where id = o.aula_id;

  if o.cancelada            then raise exception 'Aula cancelada não pode ser movida' using errcode = '22023'; end if;
  if o.data_hora <= now()   then raise exception 'Esta aula já começou e não pode ser movida' using errcode = '22023'; end if;
  if v_novo <= now()        then raise exception 'Não é possível mover uma aula para um horário que já passou' using errcode = '22023'; end if;
  if v_novo = o.data_hora   then raise exception 'A aula já está nesse horário' using errcode = '22023'; end if;
  if p_escopo = 'serie' and a.tipo::text <> 'fixa' then
    raise exception 'Aula avulsa não tem série: mova somente esta aula' using errcode = '22023';
  end if;

  v_old_local := o.data_hora at time zone c_tz;
  v_new_local := v_novo      at time zone c_tz;
  v_old_dow  := extract(dow from v_old_local)::int;
  v_new_dow  := extract(dow from v_new_local)::int;
  v_old_time := v_old_local::time;
  v_new_time := v_new_local::time;
  v_delta    := (v_new_local::date - v_old_local::date);
  v_sentido  := case when v_delta > 0 or (v_delta = 0 and v_new_time > v_old_time) then 1 else -1 end;

  -- conjunto de ocorrências que serão movidas
  drop table if exists pg_temp._agenda_mov;
  create temp table _agenda_mov (
    id uuid primary key, de timestamptz, para timestamptz,
    old_fer boolean, old_nome text, fer text
  ) on commit drop;

  if p_escopo = 'esta' then
    insert into _agenda_mov (id, de, para, old_fer, old_nome)
    values (o.id, o.data_hora, v_novo, o.eh_feriado, o.nome_feriado);
  else
    insert into _agenda_mov (id, de, para, old_fer, old_nome)
    select x.id, x.data_hora,
           ((((x.data_hora at time zone c_tz)::date + v_delta) + v_new_time) at time zone c_tz),
           x.eh_feriado, x.nome_feriado
      from public.ocorrencias x
     where x.aula_id = o.aula_id
       and not x.cancelada
       and x.data_hora >= o.data_hora
       and x.data_hora > now()
       and (x.data_hora at time zone c_tz)::time = v_old_time
       and extract(dow from (x.data_hora at time zone c_tz))::int = v_old_dow
    for update;
  end if;

  update _agenda_mov m
     set fer = (select f.nome from public.feriados f where f.data = (m.para at time zone c_tz)::date order by f.tipo limit 1);

  select count(*) into v_n from _agenda_mov;
  select count(distinct c.aluno_id) into v_conf
    from public.confirmacoes c join _agenda_mov m on m.id = c.ocorrencia_id
   where c.status = 'confirmado';

  -- erros que não dependem de confirmação
  if exists (select 1 from _agenda_mov m
               join public.ocorrencias x on x.aula_id = o.aula_id and x.data_hora = m.para
              where x.id not in (select id from _agenda_mov)) then
    raise exception 'Já existe esta aula no horário de destino' using errcode = '23505';
  end if;
  if p_escopo = 'serie' and exists (
       select 1 from public.aulas_horarios h
        where h.aula_id = o.aula_id
          and h.dia_semana = c_cod[v_new_dow + 1]::dia_semana and h.hora_inicio = v_new_time
          and not (h.dia_semana = c_cod[v_old_dow + 1]::dia_semana and h.hora_inicio = v_old_time)) then
    raise exception 'O horário de destino já existe no modelo desta aula' using errcode = '23505';
  end if;

  -- alertas que o admin pode aceitar: feriado e conflito de professor
  select count(*), string_agg(distinct fer, ', ') into v_fer_n, v_fer_nomes from _agenda_mov where fer is not null;
  if v_fer_n > 0 then
    v_avisos := v_avisos || format('%s aula(s) cairão em feriado (%s) e ficarão marcadas como feriado.', v_fer_n, v_fer_nomes);
  end if;

  if a.professor_id is not null then
    select nome into v_prof from public.perfis where id = a.professor_id;
    select count(distinct m.id),
           (array_agg(c_dias[extract(dow from (m.para at time zone c_tz))::int + 1] || ' '
                      || to_char(m.para at time zone c_tz, 'DD/MM "às" HH24:MI') order by m.para))[1]
      into v_cf_n, v_cf_ex
      from _agenda_mov m
      join public.ocorrencias o2 on not o2.cancelada and o2.id not in (select id from _agenda_mov)
      join public.aulas a2 on a2.id = o2.aula_id and a2.professor_id = a.professor_id
     where o2.data_hora < m.para + make_interval(mins => a.duracao_min)
       and o2.data_hora + make_interval(mins => a2.duracao_min) > m.para;
    if v_cf_n > 0 then
      v_avisos := v_avisos || format('%s já tem outra aula nesse horário em %s aula(s) (a primeira: %s).',
                                     coalesce(v_prof, 'O professor'), v_cf_n, v_cf_ex);
    end if;
  end if;

  if cardinality(v_avisos) > 0 and not p_confirmado then
    return jsonb_build_object('ok', false, 'precisa_confirmar', true,
                              'avisos', to_jsonb(v_avisos), 'total', v_n, 'confirmados', v_conf);
  end if;

  -- ── aplica ──
  -- guarda o estado anterior JÁ NA ORDEM em que deve ser restaurado
  select jsonb_agg(jsonb_build_object('id', m.id, 'de', m.de, 'para', m.para,
                                      'eh_feriado', m.old_fer, 'nome_feriado', m.old_nome)
                   order by case when v_sentido = 1 then extract(epoch from m.de) else -extract(epoch from m.de) end)
    into v_desfazer from _agenda_mov m;

  -- move uma por vez, começando pela que "abre caminho" (evita colisão transitória da unique aula_id+data_hora)
  for r in select * from _agenda_mov
            order by case when v_sentido = 1 then -extract(epoch from de) else extract(epoch from de) end
  loop
    update public.ocorrencias
       set data_hora = r.para, eh_feriado = (r.fer is not null), nome_feriado = r.fer
     where id = r.id;
  end loop;

  if p_escopo = 'serie' then
    update public.aulas_horarios
       set dia_semana = c_cod[v_new_dow + 1]::dia_semana, hora_inicio = v_new_time
     where aula_id = o.aula_id
       and dia_semana = c_cod[v_old_dow + 1]::dia_semana and hora_inicio = v_old_time;
    get diagnostics v_n2 = row_count;
    v_modelo_ok := v_n2 > 0;
    if v_modelo_ok then
      v_modelo := jsonb_build_object('aula_id', o.aula_id,
        'de',   jsonb_build_object('dia', c_cod[v_old_dow + 1], 'hora', to_char(v_old_time, 'HH24:MI:SS')),
        'para', jsonb_build_object('dia', c_cod[v_new_dow + 1], 'hora', to_char(v_new_time, 'HH24:MI:SS')));
    end if;
  end if;

  v_nome := case a.modalidade::text when 'hatha' then 'Hatha Yoga' when 'acro' then 'Acro Yoga'
                                    when 'raja' then 'Raja Yoga' else a.modalidade::text end;
  select min(para) into v_primeira from _agenda_mov;

  if p_avisar then
    insert into public.avisos_aula (lote, aluno_id, ocorrencia_id, escopo, titulo, corpo, de_data_hora, para_data_hora)
    select v_lote, s.aluno_id, s.ocorrencia_id, p_escopo, 'Aula remarcada: ' || v_nome,
      case p_escopo
        when 'esta' then
          format('%s: %s passou para %s. Sua confirmação foi mantida.', v_nome,
            c_dias[extract(dow from (s.de at time zone c_tz))::int + 1] || ' ' || to_char(s.de at time zone c_tz, 'DD/MM "às" HH24:MI'),
            c_dias[extract(dow from (s.para at time zone c_tz))::int + 1] || ' ' || to_char(s.para at time zone c_tz, 'DD/MM "às" HH24:MI'))
        else
          format('%s agora é às %s, %s (antes: %s, %s), a partir de %s. %s mantida(s).', v_nome,
            c_dias[v_new_dow + 1] || 's', to_char(v_new_time, 'HH24:MI'),
            c_dias[v_old_dow + 1] || 's', to_char(v_old_time, 'HH24:MI'),
            to_char(v_primeira at time zone c_tz, 'DD/MM'),
            case when s.n = 1 then 'Sua confirmação foi' else 'Suas ' || s.n || ' confirmações foram' end)
      end,
      s.de, s.para
    from (
      select distinct on (c.aluno_id) c.aluno_id, m.id as ocorrencia_id, m.de, m.para,
             count(*) over (partition by c.aluno_id) as n
        from public.confirmacoes c join _agenda_mov m on m.id = c.ocorrencia_id
       where c.status = 'confirmado'
       order by c.aluno_id, m.de
    ) s;
    get diagnostics v_alunos = row_count;
  end if;

  v_zap := case p_escopo
    when 'esta' then
      format('Aviso: a aula de %s de %s foi remarcada para %s.', v_nome,
        c_dias[extract(dow from (o.data_hora at time zone c_tz))::int + 1] || ' ' || to_char(o.data_hora at time zone c_tz, 'DD/MM "às" HH24:MI'),
        c_dias[v_new_dow + 1] || ' ' || to_char(v_new_local, 'DD/MM "às" HH24:MI'))
    else
      format('Aviso: a partir de %s, a aula de %s passa a ser às %s, %s (antes: %s, %s).',
        to_char(v_primeira at time zone c_tz, 'DD/MM'), v_nome,
        c_dias[v_new_dow + 1] || 's', to_char(v_new_time, 'HH24:MI'),
        c_dias[v_old_dow + 1] || 's', to_char(v_old_time, 'HH24:MI'))
  end;

  return jsonb_build_object(
    'ok', true, 'escopo', p_escopo, 'movidas', v_n, 'modelo_atualizado', v_modelo_ok,
    'confirmados_afetados', v_conf, 'alunos_avisados', v_alunos,
    'texto_whatsapp', v_zap,
    'desfazer', jsonb_build_object('ocorrencias', v_desfazer, 'modelo', v_modelo, 'lote', v_lote));
end;
$$;
revoke all on function public.agenda_mover_aula(uuid, timestamptz, text, boolean, boolean) from public, anon;
grant execute on function public.agenda_mover_aula(uuid, timestamptz, text, boolean, boolean) to authenticated;

-- ── 3) Desfazer ─────────────────────────────────────────────────
create or replace function public.agenda_desfazer_mover(p_desfazer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
  n int := 0;
  m jsonb := p_desfazer->'modelo';
begin
  if v_uid is null or not exists (select 1 from public.perfis where id = v_uid and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;

  -- restaura na ordem guardada; só mexe em quem ainda está no horário "novo"
  for r in
    select (e->>'id')::uuid as id, (e->>'de')::timestamptz as de, (e->>'para')::timestamptz as para,
           (e->>'eh_feriado')::boolean as fer, e->>'nome_feriado' as nome_fer
      from jsonb_array_elements(p_desfazer->'ocorrencias') with ordinality as t(e, ord)
     order by ord
  loop
    update public.ocorrencias
       set data_hora = r.de, eh_feriado = coalesce(r.fer, false), nome_feriado = r.nome_fer
     where id = r.id and data_hora = r.para;
    if found then n := n + 1; end if;
  end loop;

  if n > 0 and m is not null and jsonb_typeof(m) = 'object' then
    update public.aulas_horarios
       set dia_semana = (m->'de'->>'dia')::dia_semana, hora_inicio = (m->'de'->>'hora')::time
     where aula_id = (m->>'aula_id')::uuid
       and dia_semana = (m->'para'->>'dia')::dia_semana and hora_inicio = (m->'para'->>'hora')::time;
  end if;

  delete from public.avisos_aula where lote = (p_desfazer->>'lote')::uuid;
  return jsonb_build_object('ok', true, 'restauradas', n);
end;
$$;
revoke all on function public.agenda_desfazer_mover(jsonb) from public, anon;
grant execute on function public.agenda_desfazer_mover(jsonb) to authenticated;

-- ── 4) Exportação LGPD passa a incluir os avisos recebidos ──────
create or replace function public.lgpd_exportar_meus_dados()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r     jsonb := '{}'::jsonb;
  q     jsonb;
  t     record;
  indisponiveis text[] := '{}';
begin
  if v_uid is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  for t in
    select * from (values
      ('perfis','id'), ('matriculas','aluno_id'), ('confirmacoes','aluno_id'), ('pagamentos','aluno_id'),
      ('consentimentos','aluno_id'), ('contratos','aluno_id'), ('gamificacao','aluno_id'),
      ('aluno_conquistas','aluno_id'), ('beneficio_acessos','aluno_id'),
      ('timeline_comentarios','autor_id'), ('timeline_curtidas','perfil_id'), ('timeline_salvos','perfil_id'),
      ('timeline_visualizacoes','perfil_id'), ('timeline_enquete_votos','aluno_id'),
      ('notificacoes_lidas','perfil_id'), ('solicitacoes_titular','aluno_id'), ('avisos_aula','aluno_id')
    ) as x(tabela, coluna)
  loop
    begin
      execute format(
        'select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x where x.%I = $1',
        t.tabela, t.coluna)
      into q using v_uid;
      r := r || jsonb_build_object(t.tabela, q);
    exception when others then
      indisponiveis := indisponiveis || t.tabela::text;
    end;
  end loop;

  return jsonb_build_object('gerado_em', now(), 'titular_id', v_uid, 'dados', r,
                            'tabelas_indisponiveis', to_jsonb(indisponiveis));
end;
$$;
revoke all on function public.lgpd_exportar_meus_dados() from public, anon;
grant execute on function public.lgpd_exportar_meus_dados() to authenticated;

-- ── ROLLBACK ────────────────────────────────────────────────────
-- drop function if exists public.agenda_desfazer_mover(jsonb);
-- drop function if exists public.agenda_mover_aula(uuid, timestamptz, text, boolean, boolean);
-- drop table if exists public.avisos_aula;
