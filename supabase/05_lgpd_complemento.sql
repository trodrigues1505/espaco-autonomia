-- ============================================================
-- 05_lgpd_complemento.sql — fecha as lacunas de dados pessoais encontradas depois
-- Pré-requisitos: 01 a 04 já executados.
--
--  • Anonimização (pedido de exclusão e retenção de 2 anos) agora também:
--      - apaga os POSTS do titular na Timeline (curtidas/comentários/salvos/visualizações
--        desses posts saem junto: FK com ON DELETE CASCADE, confirmado no banco);
--      - apaga o PRÉ-CADASTRO em perfis_pendentes (pelo e-mail ou pelo vínculo Asaas);
--      - limpa a observação livre do admin em vinculos_professor_aluno;
--  • Retenção de 2 anos passa a cobrir perfis_pendentes (nome/e-mail/telefone de quem veio
--    do Asaas e nunca acessou o app), contando a partir de atualizado_em;
--  • Exportação de dados inclui posts, saldo de aulas, vínculos e o pré-cadastro.
-- ============================================================

-- ── 1) Núcleo de anonimização (substitui o do 03) ───────────────
create or replace function public.lgpd__anonimizar_core(p_aluno uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tipo       text;
  v_email_atual text;
  v_asaas      text;
  v_email_novo text;
  v_auth_ok    boolean := true;
  v_avisos     text[] := '{}';
  v_posts      int := 0;
  v_pend       int := 0;
begin
  select tipo::text, email, asaas_customer_id into v_tipo, v_email_atual, v_asaas
    from public.perfis where id = p_aluno;
  if not found then
    raise exception 'Perfil não encontrado' using errcode = 'P0002';
  end if;
  if v_tipo in ('admin','professor') then
    raise exception 'Perfis admin/professor devem ser tratados manualmente (repasses e vínculos)'
      using errcode = '42501';
  end if;

  v_email_novo := 'anonimizado-' || replace(p_aluno::text, '-', '') || '@anonimizado.invalid';

  -- pré-cadastro do Asaas (usa o e-mail ORIGINAL, por isso vem antes de sobrescrevê-lo)
  begin
    delete from public.perfis_pendentes
     where lower(email) = lower(v_email_atual)
        or (v_asaas is not null and asaas_customer_id = v_asaas);
    get diagnostics v_pend = row_count;
  exception when others then
    v_avisos := v_avisos || ('perfis_pendentes: ' || sqlerrm);
  end;

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
  begin
    update public.vinculos_professor_aluno set observacao = null
     where aluno_id = p_aluno and observacao is not null;
  exception when others then
    v_avisos := v_avisos || ('vinculos_professor_aluno: ' || sqlerrm);
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

  -- conteúdo escrito/publicado pelo titular
  begin
    delete from public.timeline_posts where autor_id = p_aluno;
    get diagnostics v_posts = row_count;
  exception when others then
    v_avisos := v_avisos || ('timeline_posts: ' || sqlerrm);
  end;
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

  return jsonb_build_object('ok', true, 'auth_anonimizado', v_auth_ok, 'avisos', to_jsonb(v_avisos),
                            'posts_apagados', v_posts, 'pre_cadastros_apagados', v_pend);
end;
$$;
revoke all on function public.lgpd__anonimizar_core(uuid) from public, anon, authenticated;

-- ── 2) RPC do admin: textos de pendência atualizados ────────────
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
    'Imagens/vídeos dos posts ficam em serviços externos (ex.: Imgur): a referência foi apagada aqui, mas o arquivo precisa ser removido lá.',
    'Pagamentos ficam retidos sem identificação direta (obrigação fiscal).'
  ));
end;
$$;
revoke all on function public.lgpd_anonimizar_titular(uuid, uuid, text) from public, anon;
grant execute on function public.lgpd_anonimizar_titular(uuid, uuid, text) to authenticated;

-- ── 3) Retenção de 2 anos também para perfis_pendentes ──────────
alter table public.lgpd_retencao_log add column if not exists origem text not null default 'perfis';

create or replace function public.lgpd__retencao_pendentes()
returns table (id uuid, nome text, email text, ultima_atividade timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nome, p.email, coalesce(p.atualizado_em, p.criado_em) as ultima_atividade
    from public.perfis_pendentes p
   where coalesce(p.atualizado_em, p.criado_em) < now() - interval '2 years';
$$;
revoke all on function public.lgpd__retencao_pendentes() from public, anon, authenticated;

create or replace function public.lgpd_retencao_previa()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb; pend jsonb;
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
  select jsonb_build_object('pendentes_total', count(*),
           'pendentes', coalesce(jsonb_agg(jsonb_build_object(
               'id', q.id, 'nome', q.nome, 'email', q.email, 'ultima_atividade', q.ultima_atividade)
             order by q.ultima_atividade) filter (where q.rn <= 20), '[]'::jsonb))
    into pend
    from (select x.*, row_number() over (order by x.ultima_atividade) as rn
            from public.lgpd__retencao_pendentes() x) q;
  return r || pend;
end;
$$;
revoke all on function public.lgpd_retencao_previa() from public, anon;
grant execute on function public.lgpd_retencao_previa() to authenticated;

create or replace function public.lgpd_retencao_executar(p_executar boolean default true, p_limite int default 200)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r       record;
  v_res   jsonb;
  v_n     int := 0;
  v_erros int := 0;
  v_pend  int := 0;
begin
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

  for r in select * from public.lgpd__retencao_pendentes() order by ultima_atividade limit p_limite loop
    if p_executar then
      begin
        delete from public.perfis_pendentes where perfis_pendentes.id = r.id;
        insert into public.lgpd_retencao_log (aluno_id, ultima_atividade, resultado, origem)
        values (r.id, r.ultima_atividade, jsonb_build_object('ok', true), 'perfis_pendentes');
        v_pend := v_pend + 1;
      exception when others then
        v_erros := v_erros + 1;
        insert into public.lgpd_retencao_log (aluno_id, ultima_atividade, resultado, origem)
        values (r.id, r.ultima_atividade, jsonb_build_object('ok', false, 'erro', sqlerrm), 'perfis_pendentes');
      end;
    else
      v_pend := v_pend + 1;
    end if;
  end loop;

  return jsonb_build_object('executado', p_executar, 'processados', v_n,
                            'pre_cadastros', v_pend, 'erros', v_erros);
end;
$$;
revoke all on function public.lgpd_retencao_executar(boolean, int) from public, anon, authenticated;

-- ── 4) Exportação LGPD completa ────────────────────────────────
create or replace function public.lgpd_exportar_meus_dados()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  r     jsonb := '{}'::jsonb;
  q     jsonb;
  t     record;
  v_email text;
  indisponiveis text[] := '{}';
begin
  if v_uid is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  for t in
    select * from (values
      ('perfis','id'), ('matriculas','aluno_id'), ('confirmacoes','aluno_id'), ('pagamentos','aluno_id'),
      ('saldo_aulas','aluno_id'), ('vinculos_professor_aluno','aluno_id'),
      ('consentimentos','aluno_id'), ('contratos','aluno_id'), ('gamificacao','aluno_id'),
      ('aluno_conquistas','aluno_id'), ('beneficio_acessos','aluno_id'),
      ('timeline_posts','autor_id'), ('timeline_comentarios','autor_id'), ('timeline_curtidas','perfil_id'),
      ('timeline_salvos','perfil_id'), ('timeline_visualizacoes','perfil_id'),
      ('timeline_enquete_votos','aluno_id'), ('timeline_enquetes','criado_por'),
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

  -- pré-cadastro (vem do Asaas; ligado pelo e-mail, não pelo id)
  begin
    select email into v_email from public.perfis where id = v_uid;
    select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into q
      from public.perfis_pendentes x where lower(x.email) = lower(v_email);
    r := r || jsonb_build_object('perfis_pendentes', q);
  exception when others then
    indisponiveis := indisponiveis || 'perfis_pendentes';
  end;

  return jsonb_build_object('gerado_em', now(), 'titular_id', v_uid, 'dados', r,
                            'tabelas_indisponiveis', to_jsonb(indisponiveis));
end;
$$;
revoke all on function public.lgpd_exportar_meus_dados() from public, anon;
grant execute on function public.lgpd_exportar_meus_dados() to authenticated;

-- ── CONFERÊNCIA (somente leitura): tabelas com dados pessoais precisam de RLS ligado ──
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace
--    and relname in ('perfis_pendentes','timeline_posts','saldo_aulas','vinculos_professor_aluno');
-- (relrowsecurity = false significa que a tabela está acessível a qualquer usuário logado)

-- ── ROLLBACK: reexecutar as definições dos arquivos 03 e 04 restaura as versões anteriores ──
