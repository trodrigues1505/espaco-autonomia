-- ============================================================
-- 03_lgpd_retencao.sql — retenção automática de 2 anos (Política, seção 6)
-- Pré-requisitos: 01_perfis_protecao.sql e 02_lgpd_titular.sql já executados.
--
-- Regra de "ex-aluno elegível" (TODAS devem valer):
--   • perfil do tipo aluno ou visitante (admin e professor nunca entram);
--   • sem matrícula ativa;
--   • sem cobrança PENDING/OVERDUE em aberto;
--   • última atividade há mais de 2 anos, sendo "atividade" o maior entre:
--     último acesso (ou criação do perfil), fim da última matrícula e
--     último vencimento de pagamento.
-- Ação: anonimiza (mesma rotina do pedido de exclusão). Pagamentos ficam retidos
-- sem identificação direta (obrigação fiscal).
-- ============================================================

-- ── 1) Núcleo de anonimização (sem checagem de admin; NÃO exposto a usuários) ──
create or replace function public.lgpd__anonimizar_core(p_aluno uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tipo       text;
  v_email_novo text;
  v_auth_ok    boolean := true;
  v_avisos     text[] := '{}';
begin
  select tipo::text into v_tipo from public.perfis where id = p_aluno;
  if not found then
    raise exception 'Perfil não encontrado' using errcode = 'P0002';
  end if;
  if v_tipo in ('admin','professor') then
    raise exception 'Perfis admin/professor devem ser tratados manualmente (repasses e vínculos)'
      using errcode = '42501';
  end if;

  v_email_novo := 'anonimizado-' || replace(p_aluno::text, '-', '') || '@anonimizado.invalid';

  -- matrículas/vínculos
  begin
    perform public.admin_desvincular_aluno(p_aluno_id := p_aluno, p_data_fim := current_date);
  exception when others then
    v_avisos := v_avisos || ('desvincular: ' || sqlerrm);
  end;
  begin
    update public.matriculas
       set ativa = false, fim = coalesce(fim, current_date)
     where aluno_id = p_aluno and ativa;
  exception when others then
    v_avisos := v_avisos || ('matriculas: ' || sqlerrm);
  end;

  -- perfil
  update public.perfis
     set nome = 'Titular removido',
         email = v_email_novo,
         telefone = null,
         foto_url = null,
         ativo = false,
         tipo = 'visitante',
         asaas_customer_id = null
   where id = p_aluno;

  -- texto livre e rastros
  begin
    delete from public.timeline_comentarios where autor_id = p_aluno;
  exception when others then
    v_avisos := v_avisos || ('timeline_comentarios: ' || sqlerrm);
  end;
  begin
    delete from public.notificacoes_lidas where perfil_id = p_aluno;
  exception when others then
    v_avisos := v_avisos || ('notificacoes_lidas: ' || sqlerrm);
  end;

  -- login (auth)
  begin
    update auth.users
       set email = v_email_novo,
           phone = null,
           raw_user_meta_data = '{}'::jsonb,
           banned_until = 'infinity'::timestamptz
     where id = p_aluno;
    delete from auth.identities where user_id = p_aluno;
    delete from auth.sessions   where user_id = p_aluno;
  exception when others then
    v_auth_ok := false;
    v_avisos := v_avisos || ('auth: ' || sqlerrm);
  end;

  return jsonb_build_object('ok', true, 'auth_anonimizado', v_auth_ok, 'avisos', to_jsonb(v_avisos));
end;
$$;
revoke all on function public.lgpd__anonimizar_core(uuid) from public, anon, authenticated;

-- ── 2) RPC do admin (pedido de exclusão) passa a usar o núcleo ──
create or replace function public.lgpd_anonimizar_titular(
  p_aluno       uuid,
  p_solicitacao uuid default null,
  p_resposta    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  r     jsonb;
begin
  if v_uid is null
     or not exists (select 1 from public.perfis where id = v_uid and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;
  if p_aluno = v_uid then
    raise exception 'Não é possível anonimizar o próprio administrador' using errcode = '42501';
  end if;

  r := public.lgpd__anonimizar_core(p_aluno);

  if p_solicitacao is not null then
    update public.solicitacoes_titular
       set status = 'atendida', resolvida_em = now(), resolvida_por = v_uid,
           resposta = left(p_resposta, 500)
     where id = p_solicitacao;
  end if;

  return r || jsonb_build_object('pendencias', jsonb_build_array(
    'Posts da Timeline criados pelo titular não são tratados por esta função — revisar manualmente.',
    'Pagamentos ficam retidos sem identificação direta (obrigação fiscal).'
  ));
end;
$$;
revoke all on function public.lgpd_anonimizar_titular(uuid, uuid, text) from public, anon;
grant execute on function public.lgpd_anonimizar_titular(uuid, uuid, text) to authenticated;

-- ── 3) Log de execuções (prestação de contas) ───────────────────
create table if not exists public.lgpd_retencao_log (
  id                bigserial primary key,
  executado_em      timestamptz not null default now(),
  aluno_id          uuid,
  ultima_atividade  timestamptz,
  resultado         jsonb,
  modo              text not null default 'automatico'
);
alter table public.lgpd_retencao_log enable row level security;
drop policy if exists "admin ve log de retencao" on public.lgpd_retencao_log;
create policy "admin ve log de retencao"
  on public.lgpd_retencao_log for select to authenticated
  using (exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin'));

-- ── 4) Quem é elegível (interno) ────────────────────────────────
create or replace function public.lgpd__retencao_candidatos()
returns table (id uuid, nome text, email text, tipo text, ultima_atividade timestamptz)
language sql
security definer
set search_path = public
as $$
  with base as (
    select p.id, p.nome, p.email, p.tipo::text as tipo,
           greatest(
             coalesce(p.ultimo_acesso, p.criado_em),
             (select max(m.fim)::timestamptz        from public.matriculas m where m.aluno_id  = p.id),
             (select max(pg.vencimento)::timestamptz from public.pagamentos pg where pg.aluno_id = p.id)
           ) as ultima_atividade
      from public.perfis p
     where p.tipo::text in ('aluno','visitante')
       and p.nome <> 'Titular removido'
       and not exists (select 1 from public.matriculas m  where m.aluno_id  = p.id and m.ativa)
       and not exists (select 1 from public.pagamentos pg where pg.aluno_id = p.id
                        and pg.status in ('PENDING','OVERDUE'))
  )
  select b.id, b.nome, b.email, b.tipo, b.ultima_atividade
    from base b
   where b.ultima_atividade < now() - interval '2 years';
$$;
revoke all on function public.lgpd__retencao_candidatos() from public, anon, authenticated;

-- ── 5) Prévia para o admin (somente leitura) ────────────────────
create or replace function public.lgpd_retencao_previa()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb;
begin
  if auth.uid() is null
     or not exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;
  select jsonb_build_object(
           'total', count(*),
           'candidatos', coalesce(jsonb_agg(jsonb_build_object(
               'id', c.id, 'nome', c.nome, 'email', c.email,
               'ultima_atividade', c.ultima_atividade) order by c.ultima_atividade)
             filter (where c.rn <= 50), '[]'::jsonb))
    into r
    from (select x.*, row_number() over (order by x.ultima_atividade) as rn
            from public.lgpd__retencao_candidatos() x) c;
  return r;
end;
$$;
revoke all on function public.lgpd_retencao_previa() from public, anon;
grant execute on function public.lgpd_retencao_previa() to authenticated;

-- ── 6) Executor (agendador / SQL Editor) ────────────────────────
create or replace function public.lgpd_retencao_executar(p_executar boolean default true, p_limite int default 200)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r      record;
  v_res  jsonb;
  v_n    int := 0;
  v_erros int := 0;
begin
  -- só roda sem usuário (pg_cron / SQL Editor) ou como admin
  if auth.uid() is not null
     and not exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;

  for r in select * from public.lgpd__retencao_candidatos() order by ultima_atividade limit p_limite loop
    if p_executar then
      begin
        v_res := public.lgpd__anonimizar_core(r.id);
        insert into public.lgpd_retencao_log (aluno_id, ultima_atividade, resultado)
        values (r.id, r.ultima_atividade, v_res);
        v_n := v_n + 1;
      exception when others then
        v_erros := v_erros + 1;
        insert into public.lgpd_retencao_log (aluno_id, ultima_atividade, resultado)
        values (r.id, r.ultima_atividade, jsonb_build_object('ok', false, 'erro', sqlerrm));
      end;
    else
      v_n := v_n + 1;
    end if;
  end loop;

  return jsonb_build_object('executado', p_executar, 'processados', v_n, 'erros', v_erros);
end;
$$;
revoke all on function public.lgpd_retencao_executar(boolean, int) from public, anon, authenticated;

-- ── PASSO A — REVISE ANTES DE AGENDAR (somente leitura) ─────────
-- select * from public.lgpd__retencao_candidatos() order by ultima_atividade;
-- select public.lgpd_retencao_executar(false);   -- só conta, não altera nada

-- ── PASSO B — AGENDAMENTO: dia 1º de cada mês, 07:00 UTC (04:00 em Brasília) ─
-- Primeira execução: 01/11/2026. Requer a extensão pg_cron (o app já a usa).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'lgpd-retencao-2-anos';
    perform cron.schedule('lgpd-retencao-2-anos', '0 7 1 * *',
                          $cron$select public.lgpd_retencao_executar(true, 200)$cron$);
  else
    raise notice 'pg_cron não está habilitado: agendamento NÃO criado.';
  end if;
end $$;

-- ── CONFERIR / DESLIGAR ─────────────────────────────────────────
-- select jobname, schedule, active from cron.job where jobname = 'lgpd-retencao-2-anos';
-- select cron.unschedule('lgpd-retencao-2-anos');
-- select * from public.lgpd_retencao_log order by executado_em desc limit 20;
