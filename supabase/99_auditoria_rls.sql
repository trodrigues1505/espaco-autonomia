-- ============================================================
-- 99_auditoria_rls.sql — "ataque simulado" de um ALUNO às tabelas (nada é gravado)
-- ============================================================
-- Como usar (SQL Editor do Supabase, tudo de uma vez):
--   1) troque <UUID_DE_UM_ALUNO> pelo id de uma conta de TESTE do tipo "aluno" (não admin);
--   2) execute; o resultado é uma tabela com uma linha por teste.
-- Como funciona: vira esse aluno e tenta LER, ALTERAR e APAGAR linhas de OUTRAS pessoas.
-- Cada tentativa roda dentro de uma subtransação que é desfeita: nenhum dado é modificado.
--   OK            = o banco bloqueou (ou não havia o que vazar com dados de outros)
--   RISCO         = o aluno conseguiu ler/alterar/apagar o que não é dele  → corrigir a política
--   INCONCLUSIVO  = não existem linhas de outras pessoas nessa tabela, então não dá para provar nada
--   não existe    = tabela ausente neste banco
-- Se aparecer "function pg_temp.auditar_rls does not exist", sua sessão não manteve a função:
-- troque "pg_temp." por "public." nas duas linhas e rode "drop function public.auditar_rls(uuid);" depois.
-- Limitação: não testa INSERT (precisa de valores válidos por tabela).
-- ============================================================

create or replace function pg_temp.auditar_rls(p_aluno uuid)
returns table (tabela text, teste text, resultado text, detalhe text)
language plpgsql
as $$
declare
  s record;
  v_tipo text; v_col text; v_cond text;
  v_outros bigint; v_n bigint; v_err text;
begin
  select tipo::text into v_tipo from public.perfis where id = p_aluno;
  if v_tipo is distinct from 'aluno' then
    raise exception 'Use o id de um perfil do tipo aluno (encontrado: %)', coalesce(v_tipo, 'inexistente');
  end if;

  for s in
    select * from (values
      -- dados PRIVADOS de cada pessoa (dono = coluna): aluno não pode ler nem mexer nos dos outros
      ('perfis','id','privada'),                    ('confirmacoes','aluno_id','privada'),
      ('pagamentos','aluno_id','privada'),          ('matriculas','aluno_id','privada'),
      ('saldo_aulas','aluno_id','privada'),         ('vinculos_professor_aluno','aluno_id','privada'),
      ('consentimentos','aluno_id','privada'),      ('contratos','aluno_id','privada'),
      ('solicitacoes_titular','aluno_id','privada'),('avisos_aula','aluno_id','privada'),
      ('notificacoes_lidas','perfil_id','privada'), ('gamificacao','aluno_id','privada'),
      ('aluno_conquistas','aluno_id','privada'),    ('beneficio_acessos','aluno_id','privada'),
      -- tabelas internas SEM dono: aluno não deve ler nem escrever nada
      ('perfis_pendentes',null,'privada'),          ('repasses_pagos',null,'privada'),
      ('professores',null,'privada'),               ('lgpd_retencao_log',null,'privada'),
      -- conteúdo que o aluno PODE ler, mas não pode alterar/apagar (o que não é dele)
      ('aulas',null,'publica'),                     ('aulas_horarios',null,'publica'),
      ('ocorrencias',null,'publica'),               ('planos',null,'publica'),
      ('plano_modalidades',null,'publica'),         ('configuracoes',null,'publica'),
      ('feriados',null,'publica'),                  ('vocabulario',null,'publica'),
      ('timeline_enquetes',null,'publica'),         ('timeline_enquete_opcoes',null,'publica'),
      ('timeline_posts','autor_id','publica'),      ('timeline_comentarios','autor_id','publica')
    ) as x(t, dono, modo)
  loop
    tabela := s.t;
    if to_regclass('public.' || s.t) is null then
      teste := '(todos)'; resultado := 'não existe'; detalhe := ''; return next; continue;
    end if;

    v_cond := case when s.dono is null then 'true'
                   else format('%I is distinct from %L::uuid', s.dono, p_aluno) end;
    reset role;
    execute format('select count(*) from public.%I where %s', s.t, v_cond) into v_outros;
    select c.column_name into v_col from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = s.t order by c.ordinal_position limit 1;

    perform set_config('request.jwt.claims', json_build_object('sub', p_aluno, 'role', 'authenticated')::text, true);
    set local role authenticated;

    -- 1) LER dados de outros (só onde isso deveria ser proibido)
    if s.modo = 'privada' then
      v_n := 0; v_err := null;
      begin
        execute format('select count(*) from public.%I where %s', s.t, v_cond) into v_n;
      exception when others then v_n := 0; v_err := sqlerrm; end;
      teste := 'ler dados de outros';
      resultado := case when v_outros = 0 then 'INCONCLUSIVO' when v_n > 0 then 'RISCO' else 'OK' end;
      detalhe := case when v_outros = 0 then 'não há linhas de outras pessoas para testar'
                       when v_n > 0 then v_n || ' de ' || v_outros || ' linhas de outros ficaram visíveis'
                       else 'bloqueado' || coalesce(' (' || v_err || ')', '') end;
      return next;
    end if;

    -- 2) ALTERAR linhas de outros (desfeito em seguida)
    v_n := 0; v_err := null;
    begin
      execute format('update public.%I set %I = %I where %s', s.t, v_col, v_col, v_cond);
      get diagnostics v_n = row_count;
      raise exception 'auditoria_rollback';
    exception when others then
      if sqlerrm <> 'auditoria_rollback' then v_n := 0; v_err := sqlerrm; end if;
    end;
    teste := 'alterar dados de outros';
    resultado := case when v_outros = 0 then 'INCONCLUSIVO' when v_n > 0 then 'RISCO' else 'OK' end;
    detalhe := case when v_outros = 0 then 'não há linhas de outras pessoas para testar'
                     when v_n > 0 then v_n || ' linha(s) de outros poderiam ser alteradas'
                     else 'bloqueado' || coalesce(' (' || left(v_err, 60) || ')', '') end;
    return next;

    -- 3) APAGAR linhas de outros (desfeito em seguida)
    v_n := 0; v_err := null;
    begin
      execute format('delete from public.%I where %s', s.t, v_cond);
      get diagnostics v_n = row_count;
      raise exception 'auditoria_rollback';
    exception when others then
      if sqlerrm <> 'auditoria_rollback' then v_n := 0; v_err := sqlerrm; end if;
    end;
    teste := 'apagar dados de outros';
    resultado := case when v_outros = 0 then 'INCONCLUSIVO' when v_n > 0 then 'RISCO' else 'OK' end;
    detalhe := case when v_outros = 0 then 'não há linhas de outras pessoas para testar'
                     when v_n > 0 then v_n || ' linha(s) de outros poderiam ser apagadas'
                     else 'bloqueado' || coalesce(' (' || left(v_err, 60) || ')', '') end;
    return next;
  end loop;
  reset role;
end;
$$;

select * from pg_temp.auditar_rls('<UUID_DE_UM_ALUNO>'::uuid)
 order by case resultado when 'RISCO' then 0 when 'INCONCLUSIVO' then 1 when 'OK' then 2 else 3 end, tabela, teste;

-- ── E uma checagem geral, sem simulação: tabelas do schema public SEM rls ligado ──
-- select relname from pg_class
--  where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity order by 1;
