-- 07_ia_limite.sql — limite de uso da IA GLOBAL e ATÔMICO (substitui o limite "por instância" da Edge Function).
-- Rode ANTES de publicar a nova anthropic-proxy. Se esta função não existir, a Edge Function cai num limite local
-- (menos preciso) e registra o erro no log.
--
-- Regra: 20 chamadas por 10 minutos por administrador. Para mudar, edite as duas constantes abaixo.
create table if not exists public.ia_uso (
  id         bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);
create index if not exists ia_uso_usuario_tempo on public.ia_uso (usuario_id, criado_em desc);

-- RLS ligado e SEM políticas: ninguém lê nem escreve a tabela diretamente; só a função abaixo (security definer).
alter table public.ia_uso enable row level security;

create or replace function public.ia_registrar_uso()
returns table(permitido boolean, usadas int, retry_apos_seg int)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  c_limite  constant int      := 20;
  c_janela  constant interval := interval '10 minutes';
  uid uuid := auth.uid();
  n int; mais_antigo timestamptz;
begin
  if uid is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;
  if not exists (select 1 from public.perfis where id = uid and tipo = 'admin') then
    raise exception 'restrito a administradores' using errcode = '42501';
  end if;

  -- serializa as chamadas do MESMO usuário: sem isso, 30 requisições simultâneas passariam todas na contagem
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 7));

  delete from public.ia_uso where usuario_id = uid and criado_em < now() - interval '1 day';   -- limpeza barata
  select count(*), min(criado_em) into n, mais_antigo
    from public.ia_uso where usuario_id = uid and criado_em > now() - c_janela;

  if n >= c_limite then
    return query select false, n, greatest(1, ceil(extract(epoch from (mais_antigo + c_janela - now())))::int);
    return;
  end if;
  insert into public.ia_uso (usuario_id) values (uid);
  return query select true, n + 1, 0;
end $$;

revoke all on function public.ia_registrar_uso() from public, anon;
grant execute on function public.ia_registrar_uso() to authenticated;
