-- ============================================================
-- 02_lgpd_titular.sql — direitos do titular (LGPD Art. 18)
--  • tabela de solicitações (exclusão, correção, informação)
--  • exportação dos dados do próprio titular
--  • anonimização de titular (somente admin)
-- Rodar no SQL Editor do Supabase. Pré-requisito: 01_perfis_protecao.sql.
-- ============================================================

-- ── 1) Solicitações do titular ────────────────────────────────
create table if not exists public.solicitacoes_titular (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid not null references public.perfis(id) on delete cascade,
  tipo           text not null check (tipo in ('exclusao','correcao','informacao')),
  mensagem       text check (char_length(mensagem) <= 500),
  status         text not null default 'aberta' check (status in ('aberta','atendida','recusada')),
  criada_em      timestamptz not null default now(),
  resolvida_em   timestamptz,
  resolvida_por  uuid references public.perfis(id),
  resposta       text check (char_length(resposta) <= 500)
);

-- no máximo 1 solicitação aberta por tipo e por titular
create unique index if not exists uq_solicitacao_aberta
  on public.solicitacoes_titular (aluno_id, tipo) where status = 'aberta';

alter table public.solicitacoes_titular enable row level security;

drop policy if exists "titular ve proprias solicitacoes" on public.solicitacoes_titular;
create policy "titular ve proprias solicitacoes"
  on public.solicitacoes_titular for select to authenticated
  using (aluno_id = auth.uid());

drop policy if exists "titular cria solicitacao" on public.solicitacoes_titular;
create policy "titular cria solicitacao"
  on public.solicitacoes_titular for insert to authenticated
  with check (aluno_id = auth.uid() and status = 'aberta'
              and resolvida_em is null and resolvida_por is null and resposta is null);

drop policy if exists "admin ve todas solicitacoes" on public.solicitacoes_titular;
create policy "admin ve todas solicitacoes"
  on public.solicitacoes_titular for select to authenticated
  using (exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin'));

drop policy if exists "admin atualiza solicitacoes" on public.solicitacoes_titular;
create policy "admin atualiza solicitacoes"
  on public.solicitacoes_titular for update to authenticated
  using      (exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin'))
  with check (exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin'));

-- ── 2) Exportação dos dados do próprio titular (Art. 18, II e V) ─
-- Tabelas/colunas que não existirem são ignoradas e listadas em
-- "tabelas_indisponiveis" (não quebra a exportação).
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
      ('perfis','id'),
      ('matriculas','aluno_id'),
      ('confirmacoes','aluno_id'),
      ('pagamentos','aluno_id'),
      ('consentimentos','aluno_id'),
      ('contratos','aluno_id'),
      ('gamificacao','aluno_id'),
      ('aluno_conquistas','aluno_id'),
      ('beneficio_acessos','aluno_id'),
      ('timeline_comentarios','autor_id'),
      ('timeline_curtidas','perfil_id'),
      ('timeline_salvos','perfil_id'),
      ('timeline_visualizacoes','perfil_id'),
      ('timeline_enquete_votos','aluno_id'),
      ('notificacoes_lidas','perfil_id'),
      ('solicitacoes_titular','aluno_id')
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

  return jsonb_build_object(
    'gerado_em', now(),
    'titular_id', v_uid,
    'dados', r,
    'tabelas_indisponiveis', to_jsonb(indisponiveis)
  );
end;
$$;

revoke all on function public.lgpd_exportar_meus_dados() from public, anon;
grant execute on function public.lgpd_exportar_meus_dados() to authenticated;

-- ── 3) Anonimização de titular (somente admin) ────────────────
-- Não apaga linhas: o app tem dezenas de tabelas ligadas a perfis (FKs).
-- Remove a identificação (nome, e-mail, telefone, foto, vínculo Asaas e login),
-- encerra matrículas e apaga o texto livre que o titular escreveu.
-- Mantém registros de pagamento/contrato/consentimento (ficam sem identificação
-- direta; pagamentos podem ter de ser guardados por obrigação fiscal).
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
  v_uid        uuid := auth.uid();
  v_tipo       text;
  v_email_novo text;
  v_auth_ok    boolean := true;
  v_avisos     text[] := '{}';
begin
  if v_uid is null
     or not exists (select 1 from public.perfis where id = v_uid and tipo = 'admin') then
    raise exception 'Somente administradores' using errcode = '42501';
  end if;
  if p_aluno = v_uid then
    raise exception 'Não é possível anonimizar o próprio administrador' using errcode = '42501';
  end if;

  select tipo::text into v_tipo from public.perfis where id = p_aluno;
  if not found then
    raise exception 'Perfil não encontrado' using errcode = 'P0002';
  end if;
  if v_tipo in ('admin','professor') then
    raise exception 'Perfis admin/professor devem ser tratados manualmente (repasses e vínculos)'
      using errcode = '42501';
  end if;

  v_email_novo := 'anonimizado-' || replace(p_aluno::text, '-', '') || '@anonimizado.invalid';

  -- 3.1 encerra matrícula/vínculos (função já usada pelo app); falha não interrompe
  begin
    perform public.admin_desvincular_aluno(p_aluno_id := p_aluno, p_data_fim := current_date);
  exception when others then
    v_avisos := v_avisos || ('desvincular: ' || sqlerrm);
  end;

  -- 3.2 perfil
  update public.perfis
     set nome = 'Titular removido',
         email = v_email_novo,
         telefone = null,
         foto_url = null,
         ativo = false,
         tipo = 'visitante',
         asaas_customer_id = null
   where id = p_aluno;

  -- 3.3 texto livre escrito pelo titular
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

  -- 3.4 login (auth): e-mail, metadados, identidades Google e sessões
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

  -- 3.5 fecha a solicitação
  if p_solicitacao is not null then
    update public.solicitacoes_titular
       set status = 'atendida', resolvida_em = now(), resolvida_por = v_uid,
           resposta = left(p_resposta, 500)
     where id = p_solicitacao;
  end if;

  return jsonb_build_object(
    'ok', true,
    'auth_anonimizado', v_auth_ok,
    'avisos', to_jsonb(v_avisos),
    'pendencias', jsonb_build_array(
      'Posts da Timeline criados pelo titular não são tratados por esta função — revisar manualmente.',
      'Pagamentos ficam retidos sem identificação direta (obrigação fiscal).'
    )
  );
end;
$$;

revoke all on function public.lgpd_anonimizar_titular(uuid, uuid, text) from public, anon;
grant execute on function public.lgpd_anonimizar_titular(uuid, uuid, text) to authenticated;

-- ── 4) Consulta de apoio (SOMENTE LEITURA) — revisão de retenção de 2 anos ─
-- Perfis sem acesso há mais de 2 anos. Revise manualmente antes de anonimizar.
-- select id, nome, email, tipo, ativo, ultimo_acesso
--   from public.perfis
--  where tipo in ('visitante','aluno')
--    and coalesce(ultimo_acesso, atualizado_em) < now() - interval '2 years'
--  order by coalesce(ultimo_acesso, atualizado_em);

-- ── TESTE (use uma conta de teste, nunca um aluno real) ───────
-- 1) Como a conta de teste: Privacidade → "Baixar meus dados" e "Solicitar exclusão".
-- 2) Como admin: Configurações → Solicitações de titulares → "Anonimizar e concluir".
-- 3) Confira: select nome, email, ativo, tipo from perfis where id = '<UUID_TESTE>';
--    e em Authentication → Users o e-mail deve aparecer como anonimizado-...@anonimizado.invalid.
-- ROLLBACK da estrutura (não desfaz anonimizações já feitas):
-- drop function if exists public.lgpd_anonimizar_titular(uuid, uuid, text);
-- drop function if exists public.lgpd_exportar_meus_dados();
-- drop table if exists public.solicitacoes_titular;
