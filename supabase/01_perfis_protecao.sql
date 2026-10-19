-- ============================================================
-- 01_perfis_protecao.sql — protege perfis contra escalada de privilégio
-- Rodar no SQL Editor do Supabase, NESTA ORDEM.
-- ============================================================

-- ── PASSO 1 — PROVA (não grava nada: termina em ROLLBACK) ─────
-- Troque <UUID_ALUNO> por o id de um aluno de teste (NÃO admin).
-- Rode o bloco inteiro de uma vez.
--   "UPDATE 1" + tipo = 'admin'  → vulnerável (confirma o achado)
--   ERRO 42501                   → já protegido
begin;
  select set_config('request.jwt.claims',
         json_build_object('sub','<UUID_ALUNO>','role','authenticated')::text, true);
  set local role authenticated;
  update public.perfis set tipo = 'admin' where id = '<UUID_ALUNO>';
  select id, tipo from public.perfis where id = '<UUID_ALUNO>';
rollback;

-- ── PASSO 2 — CORREÇÃO ────────────────────────────────────────
create or replace function public.perfis_proteger_campos()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid        uuid := auth.uid();
  v_email_auth text;
begin
  -- Sem usuário no JWT (SQL Editor, pg_cron, service_role): não interfere.
  if v_uid is null then return new; end if;

  -- Admin: liberado (promover visitante, editar aluno, sync Asaas etc.).
  if exists (select 1 from public.perfis where id = v_uid and tipo = 'admin') then
    return new;
  end if;

  -- E-mail sempre vem do Auth, nunca do cliente.
  select u.email into v_email_auth from auth.users u where u.id = new.id;
  if v_email_auth is not null and lower(coalesce(new.email,'')) <> lower(v_email_auth) then
    new.email := v_email_auth;
  end if;

  -- Defesa em profundidade contra HTML injetado em campos de texto.
  if new.nome ~ '[<>"`\\]' or new.nome ~* '&#?[a-z0-9]+;' then
    raise exception 'Nome contém caracteres não permitidos' using errcode = '22023';
  end if;
  if new.telefone is not null
     and (new.telefone ~ '[<>"`\\]' or new.telefone ~* '&#?[a-z0-9]+;') then
    raise exception 'Telefone contém caracteres não permitidos' using errcode = '22023';
  end if;
  if new.foto_url is not null and new.foto_url !~* '^https://' then
    raise exception 'foto_url deve começar com https://' using errcode = '22023';
  end if;

  if tg_op = 'INSERT' then
    -- Auto-cadastro (onboarding): sempre nasce visitante, ativo, sem vínculo Asaas.
    new.tipo := 'visitante';
    new.ativo := true;
    new.asaas_customer_id := null;
  else
    if new.tipo is distinct from old.tipo
       or new.ativo is distinct from old.ativo
       or new.asaas_customer_id is distinct from old.asaas_customer_id then
      raise exception 'Alteração de tipo, ativo ou asaas_customer_id não permitida'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_perfis_proteger_campos on public.perfis;
create trigger trg_perfis_proteger_campos
  before insert or update on public.perfis
  for each row execute function public.perfis_proteger_campos();

-- ── PASSO 3 — RE-TESTE: repita o PASSO 1. Esperado: ERRO 42501. ─
-- Depois, no app: (a) aluno edita nome/telefone → funciona;
-- (b) admin promove visitante e edita aluno → funciona.

-- ── ROLLBACK (se algo do app quebrar) ─────────────────────────
-- drop trigger if exists trg_perfis_proteger_campos on public.perfis;
-- drop function if exists public.perfis_proteger_campos();
