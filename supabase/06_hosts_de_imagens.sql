-- 06_hosts_de_imagens.sql — SOMENTE LEITURA. RODE ANTES de publicar a versão com lista de hosts de imagem (CSP img-src).
--
-- O app agora só carrega imagem de: i.imgur.com, *.googleusercontent.com (foto do Google), o Storage do seu
-- Supabase e tummee.com / *.tummee.com. Imagem de qualquer outro host deixa de aparecer (e a Timeline mostra o
-- link como cartão). Esta consulta varre TODAS as colunas de texto do schema public cujo nome sugere URL
-- (url, foto, imagem, capa, midia, avatar, link) e mostra de quais hosts elas vêm.
--
-- COMO LER: olhe só as colunas que guardam IMAGEM (foto_url, imagem_url, capa_url, midia_url de imagem…).
--   • "ok (imagem)"        → continua funcionando.
--   • "link/embed"         → não é imagem (YouTube, Vimeo, WhatsApp, Google Docs): não é afetado.
--   • "FORA DA LISTA"      → se a coluna for de IMAGEM, essas imagens vão parar de aparecer.
--     Soluções: subir a imagem no Imgur / Supabase Storage e trocar a URL; OU, se o host for confiável, acrescentá-lo
--     em HOSTS_IMAGEM (src/modules/utils.js) E no img-src do index.html (rode ferramentas/verifica-csp.mjs).
create or replace function pg_temp.hosts_de_urls()
returns table(tabela text, coluna text, host text, qtd bigint)
language plpgsql as $$
declare r record;
begin
  for r in
    select c.table_name::text as t, c.column_name::text as col
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
    where c.table_schema = 'public'
      and c.data_type in ('text', 'character varying')
      and c.column_name ~* '(url|foto|imagem|capa|midia|avatar|link)'
  loop
    return query execute format(
      'select %L::text, %L::text, substring(lower(%I) from ''^https?://([^/:?#]+)'')::text, count(*)::bigint
         from public.%I where %I ~* ''^https?://'' group by 3',
      r.t, r.col, r.col, r.t, r.col);
  end loop;
end $$;

select tabela, coluna, host, qtd,
  case
    when host = 'i.imgur.com' or host = 'kctgcjvfsuinwlbgljdw.supabase.co' or host = 'tummee.com'
      or host like '%.googleusercontent.com' or host like '%.tummee.com'                   then 'ok (imagem)'
    when host in ('www.youtube.com','youtube.com','youtu.be','vimeo.com','player.vimeo.com',
                  'chat.whatsapp.com','wa.me','docs.google.com','drive.google.com')        then 'link/embed (não é imagem)'
    else 'FORA DA LISTA'
  end as situacao
from pg_temp.hosts_de_urls()
order by (case when host = 'i.imgur.com' or host = 'kctgcjvfsuinwlbgljdw.supabase.co' or host = 'tummee.com'
                 or host like '%.googleusercontent.com' or host like '%.tummee.com' then 2
               when host in ('www.youtube.com','youtube.com','youtu.be','vimeo.com','player.vimeo.com','chat.whatsapp.com','wa.me','docs.google.com','drive.google.com') then 1
               else 0 end), tabela, coluna, qtd desc;
