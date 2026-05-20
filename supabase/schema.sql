-- ============================================================
-- ESPAÇO AUTONOMIA — Schema Supabase (PostgreSQL)
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type plano_tipo as enum ('brahma', 'shiva', 'vishnu');
create type modalidade_tipo as enum ('hatha', 'acro', 'raja');
create type aula_tipo as enum ('fixa', 'avulsa');
create type dia_semana as enum ('seg','ter','qua','qui','sex','sab','dom');
create type confirmacao_status as enum ('pendente','confirmado','cancelado','presente','ausente');
create type perfil_tipo as enum ('admin','professor','aluno');

-- ============================================================
-- PERFIS (estende auth.users do Supabase)
-- ============================================================
create table perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  telefone    text,
  tipo        perfil_tipo not null default 'aluno',
  ativo       boolean not null default true,
  foto_url    text,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ============================================================
-- PLANOS
-- ============================================================
create table planos (
  id              uuid primary key default uuid_generate_v4(),
  tipo            plano_tipo not null unique,
  nome            text not null,          -- 'Brahma', 'Shiva', 'Vishnu'
  descricao       text,
  preco_1x        numeric(8,2),           -- 1 aula/semana
  preco_2x        numeric(8,2),           -- 2 aulas/semana
  preco_livre     numeric(8,2),           -- uso livre (só Vishnu)
  aulas_semana_max int,                   -- null = ilimitado
  -- Benefícios (conforme identidade visual)
  sangha          boolean not null default true,   -- grupo WhatsApp
  kala_sadhya     boolean not null default true,   -- agenda flex
  asana_marga     boolean not null default false,  -- app aula prática
  yoga_adhyayana  boolean not null default false,  -- estudo teórico
  jnana_marga     boolean not null default false,  -- estudo literário
  sadhana_purna   boolean not null default false,  -- avaliação progresso
  atma_vijnana    boolean not null default false,  -- anamnese personalizada
  shruti          boolean not null default false,  -- áudio diário
  naada_mandir    boolean not null default false,  -- biblioteca mantras
  criado_em       timestamptz not null default now()
);

-- Inserir planos base
insert into planos (tipo, nome, descricao, preco_1x, preco_2x, preco_livre, aulas_semana_max,
  sangha, kala_sadhya, asana_marga, yoga_adhyayana, jnana_marga, sadhana_purna, atma_vijnana, shruti, naada_mandir)
values
  ('brahma', 'Brahma', 'Plano de entrada, 1 aula por semana', 100.00, null, null, 1,
    true,  true,  false, false, false, false, false, false, false),
  ('shiva',  'Shiva',  'Plano intermediário, 1 ou 2 aulas por semana', 150.00, 200.00, null, 2,
    true,  true,  true,  true,  true,  true,  true,  false, false),
  ('vishnu', 'Vishnu', 'Plano completo, uso livre', 250.00, null, 300.00, null,
    true,  true,  true,  true,  true,  true,  true,  true,  true);

-- ============================================================
-- MODALIDADES PERMITIDAS POR PLANO
-- ============================================================
create table plano_modalidades (
  plano_tipo  plano_tipo not null,
  modalidade  modalidade_tipo not null,
  primary key (plano_tipo, modalidade)
);

insert into plano_modalidades values
  ('brahma', 'hatha'),
  ('shiva',  'hatha'),
  ('shiva',  'raja'),
  ('vishnu', 'hatha'),
  ('vishnu', 'raja'),
  ('vishnu', 'acro');

-- ============================================================
-- MATRÍCULAS (aluno ↔ plano)
-- ============================================================
create table matriculas (
  id              uuid primary key default uuid_generate_v4(),
  aluno_id        uuid not null references perfis(id) on delete cascade,
  plano_tipo      plano_tipo not null,
  opcao_aulas     int not null default 1,   -- 1 ou 2 aulas/semana; 99 = livre
  valor_mensal    numeric(8,2) not null,
  inicio          date not null default current_date,
  fim             date,                     -- null = vigente
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now(),
  constraint aulas_validas check (opcao_aulas in (1, 2, 99))
);

-- ============================================================
-- PROFESSORES (perfis com tipo='professor' + info extra)
-- ============================================================
create table professores (
  id          uuid primary key references perfis(id) on delete cascade,
  bio         text,
  especialidades modalidade_tipo[] default '{}',
  criado_em   timestamptz not null default now()
);

-- ============================================================
-- AULAS (template — define a aula recorrente ou avulsa)
-- ============================================================
create table aulas (
  id              uuid primary key default uuid_generate_v4(),
  modalidade      modalidade_tipo not null,
  tipo            aula_tipo not null default 'fixa',
  professor_id    uuid references perfis(id),
  vagas           int not null default 15,
  duracao_min     int not null default 60,
  observacoes     text,
  ativa           boolean not null default true,
  criado_por      uuid references perfis(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- Horários recorrentes (para aulas fixas)
create table aulas_horarios (
  id          uuid primary key default uuid_generate_v4(),
  aula_id     uuid not null references aulas(id) on delete cascade,
  dia_semana  dia_semana not null,
  hora_inicio time not null,
  unique (aula_id, dia_semana, hora_inicio)
);

-- ============================================================
-- OCORRÊNCIAS (instâncias reais de cada aula — geradas automaticamente)
-- ============================================================
create table ocorrencias (
  id              uuid primary key default uuid_generate_v4(),
  aula_id         uuid not null references aulas(id) on delete cascade,
  data_hora       timestamptz not null,
  vagas_override  int,          -- sobrescreve vagas da aula se preenchido
  cancelada       boolean not null default false,
  motivo_cancel   text,
  eh_feriado      boolean not null default false,
  nome_feriado    text,
  criado_em       timestamptz not null default now(),
  unique (aula_id, data_hora)
);

-- ============================================================
-- CONFIRMAÇÕES (aluno confirma presença numa ocorrência)
-- ============================================================
create table confirmacoes (
  id              uuid primary key default uuid_generate_v4(),
  ocorrencia_id   uuid not null references ocorrencias(id) on delete cascade,
  aluno_id        uuid not null references perfis(id) on delete cascade,
  status          confirmacao_status not null default 'pendente',
  confirmado_em   timestamptz,
  cancelado_em    timestamptz,
  presenca_em     timestamptz,   -- quando professor marcou presença
  criado_em       timestamptz not null default now(),
  unique (ocorrencia_id, aluno_id)
);

-- ============================================================
-- CONFIGURAÇÕES DO SISTEMA
-- ============================================================
create table configuracoes (
  chave       text primary key,
  valor       text not null,
  descricao   text,
  atualizado_em timestamptz not null default now()
);

insert into configuracoes (chave, valor, descricao) values
  ('prazo_confirmacao_min',   '60',    'Minutos antes da aula para confirmar presença'),
  ('prazo_cancelamento_min',  '180',   'Minutos antes da aula para cancelar confirmação'),
  ('vagas_padrao',            '15',    'Vagas padrão ao criar nova aula'),
  ('alerta_feriado_dias',     '7',     'Dias de antecedência para alertar sobre feriados'),
  ('feriados_nacionais',      'true',  'Verificar feriados nacionais'),
  ('feriados_estaduais_sp',   'true',  'Verificar feriados estaduais SP'),
  ('feriados_municipais',     'false', 'Verificar feriados municipais'),
  ('lembrete_horas_antes',    '2',     'Horas antes para enviar lembrete ao aluno');

-- ============================================================
-- FERIADOS
-- ============================================================
create table feriados (
  id          uuid primary key default uuid_generate_v4(),
  data        date not null,
  nome        text not null,
  tipo        text not null check (tipo in ('nacional','estadual','municipal')),
  estado      text,   -- 'SP'
  municipio   text,   -- 'Franco da Rocha'
  unique (data, tipo, municipio)
);

-- Feriados 2026 (nacionais + SP)
insert into feriados (data, nome, tipo) values
  ('2026-01-01', 'Ano Novo',               'nacional'),
  ('2026-02-16', 'Carnaval (segunda)',      'nacional'),
  ('2026-02-17', 'Carnaval (terça)',        'nacional'),
  ('2026-04-03', 'Sexta-feira Santa',       'nacional'),
  ('2026-04-21', 'Tiradentes',              'nacional'),
  ('2026-05-01', 'Dia do Trabalho',         'nacional'),
  ('2026-06-11', 'Corpus Christi',          'nacional'),
  ('2026-09-07', 'Independência do Brasil', 'nacional'),
  ('2026-10-12', 'Nossa Sra. Aparecida',    'nacional'),
  ('2026-11-02', 'Finados',                 'nacional'),
  ('2026-11-15', 'Proclamação da República','nacional'),
  ('2026-12-25', 'Natal',                   'nacional');

insert into feriados (data, nome, tipo, estado) values
  ('2026-07-09', 'Revolução Constitucionalista', 'estadual', 'SP');

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- Vagas disponíveis por ocorrência
create or replace view ocorrencias_vagas as
select
  o.id,
  o.aula_id,
  o.data_hora,
  o.cancelada,
  o.eh_feriado,
  o.nome_feriado,
  a.modalidade,
  a.tipo as aula_tipo,
  coalesce(o.vagas_override, a.vagas) as vagas_total,
  count(c.id) filter (where c.status = 'confirmado') as confirmados,
  coalesce(o.vagas_override, a.vagas) - count(c.id) filter (where c.status = 'confirmado') as vagas_livres,
  p.nome as professor_nome,
  p.id as professor_id
from ocorrencias o
join aulas a on a.id = o.aula_id
left join perfis p on p.id = a.professor_id
left join confirmacoes c on c.ocorrencia_id = o.id
group by o.id, o.aula_id, o.data_hora, o.cancelada, o.eh_feriado, o.nome_feriado,
         a.modalidade, a.tipo, a.vagas, o.vagas_override, p.nome, p.id;

-- Alunos com plano ativo
create or replace view alunos_plano_ativo as
select
  p.id,
  p.nome,
  p.email,
  p.telefone,
  p.ativo,
  m.plano_tipo,
  m.opcao_aulas,
  m.valor_mensal,
  m.inicio,
  m.fim,
  pl.preco_1x,
  pl.preco_2x,
  pl.preco_livre,
  pl.sangha, pl.kala_sadhya, pl.asana_marga, pl.yoga_adhyayana,
  pl.jnana_marga, pl.sadhana_purna, pl.atma_vijnana, pl.shruti, pl.naada_mandir
from perfis p
join matriculas m on m.aluno_id = p.id and m.ativa = true
join planos pl on pl.tipo = m.plano_tipo
where p.tipo = 'aluno';

-- ============================================================
-- FUNÇÕES
-- ============================================================

-- Verifica se aluno pode confirmar presença
create or replace function pode_confirmar(
  p_aluno_id uuid,
  p_ocorrencia_id uuid
) returns jsonb language plpgsql as $$
declare
  v_ocorrencia ocorrencias%rowtype;
  v_aula aulas%rowtype;
  v_matricula matriculas%rowtype;
  v_prazo int;
  v_limite timestamptz;
  v_conf_existente confirmacoes%rowtype;
  v_vagas_livres int;
  v_modalidade_ok boolean;
begin
  -- Busca ocorrência
  select * into v_ocorrencia from ocorrencias where id = p_ocorrencia_id;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'Aula não encontrada'); end if;
  if v_ocorrencia.cancelada then return jsonb_build_object('ok', false, 'motivo', 'Aula cancelada'); end if;

  -- Busca aula
  select * into v_aula from aulas where id = v_ocorrencia.aula_id;

  -- Busca matrícula ativa
  select * into v_matricula from matriculas where aluno_id = p_aluno_id and ativa = true limit 1;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'Sem matrícula ativa'); end if;

  -- Verifica modalidade do plano
  select exists(
    select 1 from plano_modalidades
    where plano_tipo = v_matricula.plano_tipo and modalidade = v_aula.modalidade
  ) into v_modalidade_ok;
  if not v_modalidade_ok then
    return jsonb_build_object('ok', false, 'motivo', 'Sua modalidade não inclui ' || v_aula.modalidade || '. Considere um upgrade de plano.');
  end if;

  -- Prazo de confirmação
  select valor::int into v_prazo from configuracoes where chave = 'prazo_confirmacao_min';
  v_limite := v_ocorrencia.data_hora - (v_prazo || ' minutes')::interval;
  if now() > v_limite then
    return jsonb_build_object('ok', false, 'motivo', 'Prazo de confirmação encerrado (' || v_prazo || ' min antes)');
  end if;

  -- Confirmação já existe?
  select * into v_conf_existente from confirmacoes
    where ocorrencia_id = p_ocorrencia_id and aluno_id = p_aluno_id;
  if found and v_conf_existente.status = 'confirmado' then
    return jsonb_build_object('ok', false, 'motivo', 'Presença já confirmada');
  end if;

  -- Vagas disponíveis
  select vagas_livres into v_vagas_livres from ocorrencias_vagas where id = p_ocorrencia_id;
  if v_vagas_livres <= 0 then
    return jsonb_build_object('ok', false, 'motivo', 'Aula lotada');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Confirmar presença
create or replace function confirmar_presenca(
  p_aluno_id uuid,
  p_ocorrencia_id uuid
) returns jsonb language plpgsql security definer as $$
declare v_check jsonb; begin
  v_check := pode_confirmar(p_aluno_id, p_ocorrencia_id);
  if not (v_check->>'ok')::boolean then return v_check; end if;

  insert into confirmacoes (ocorrencia_id, aluno_id, status, confirmado_em)
  values (p_ocorrencia_id, p_aluno_id, 'confirmado', now())
  on conflict (ocorrencia_id, aluno_id)
  do update set status = 'confirmado', confirmado_em = now(), cancelado_em = null;

  return jsonb_build_object('ok', true, 'mensagem', 'Presença confirmada!');
end;
$$;

-- Cancelar confirmação
create or replace function cancelar_confirmacao(
  p_aluno_id uuid,
  p_ocorrencia_id uuid
) returns jsonb language plpgsql security definer as $$
declare
  v_ocorrencia ocorrencias%rowtype;
  v_prazo int;
  v_limite timestamptz;
begin
  select * into v_ocorrencia from ocorrencias where id = p_ocorrencia_id;
  select valor::int into v_prazo from configuracoes where chave = 'prazo_cancelamento_min';
  v_limite := v_ocorrencia.data_hora - (v_prazo || ' minutes')::interval;

  if now() > v_limite then
    return jsonb_build_object('ok', false, 'motivo', 'Prazo para cancelamento encerrado');
  end if;

  update confirmacoes
    set status = 'cancelado', cancelado_em = now()
    where ocorrencia_id = p_ocorrencia_id and aluno_id = p_aluno_id;

  return jsonb_build_object('ok', true, 'mensagem', 'Confirmação cancelada');
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table perfis           enable row level security;
alter table matriculas       enable row level security;
alter table aulas            enable row level security;
alter table aulas_horarios   enable row level security;
alter table ocorrencias      enable row level security;
alter table confirmacoes     enable row level security;
alter table configuracoes    enable row level security;
alter table feriados         enable row level security;
alter table planos           enable row level security;
alter table plano_modalidades enable row level security;

-- Helper: tipo do usuário logado
create or replace function meu_tipo() returns perfil_tipo language sql stable as
$$ select tipo from perfis where id = auth.uid(); $$;

-- PERFIS
create policy "Vê próprio perfil" on perfis for select using (id = auth.uid());
create policy "Admin vê todos" on perfis for select using (meu_tipo() = 'admin');
create policy "Atualiza próprio perfil" on perfis for update using (id = auth.uid());
create policy "Admin gerencia perfis" on perfis for all using (meu_tipo() = 'admin');

-- PLANOS & MODALIDADES — todos leem, admin escreve
create policy "Todos leem planos" on planos for select using (true);
create policy "Todos leem modalidades" on plano_modalidades for select using (true);
create policy "Admin edita planos" on planos for all using (meu_tipo() = 'admin');

-- MATRÍCULAS
create policy "Aluno vê própria matrícula" on matriculas for select using (aluno_id = auth.uid());
create policy "Admin/prof vê todas" on matriculas for select using (meu_tipo() in ('admin','professor'));
create policy "Admin gerencia matrículas" on matriculas for all using (meu_tipo() = 'admin');

-- AULAS — todos leem, admin/prof escrevem
create policy "Todos leem aulas" on aulas for select using (true);
create policy "Todos leem horários" on aulas_horarios for select using (true);
create policy "Admin cria/edita aulas" on aulas for all using (meu_tipo() = 'admin');
create policy "Prof edita suas aulas" on aulas for update using (meu_tipo() = 'professor' and professor_id = auth.uid());
create policy "Admin gerencia horários" on aulas_horarios for all using (meu_tipo() = 'admin');

-- OCORRÊNCIAS — todos leem, admin escreve
create policy "Todos leem ocorrências" on ocorrencias for select using (true);
create policy "Admin gerencia ocorrências" on ocorrencias for all using (meu_tipo() = 'admin');

-- CONFIRMAÇÕES
create policy "Aluno vê próprias confirmações" on confirmacoes for select using (aluno_id = auth.uid());
create policy "Admin/prof vê todas confirmações" on confirmacoes for select using (meu_tipo() in ('admin','professor'));
create policy "Aluno cria confirmação" on confirmacoes for insert with check (aluno_id = auth.uid());
create policy "Aluno cancela própria" on confirmacoes for update using (aluno_id = auth.uid());
create policy "Admin/prof atualiza confirmações" on confirmacoes for update using (meu_tipo() in ('admin','professor'));

-- CONFIGURAÇÕES — todos leem, só admin escreve
create policy "Todos leem config" on configuracoes for select using (true);
create policy "Admin edita config" on configuracoes for all using (meu_tipo() = 'admin');

-- FERIADOS — todos leem
create policy "Todos leem feriados" on feriados for select using (true);
create policy "Admin gerencia feriados" on feriados for all using (meu_tipo() = 'admin');

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end; $$;

create trigger trg_perfis_updated
  before update on perfis
  for each row execute function set_atualizado_em();

create trigger trg_aulas_updated
  before update on aulas
  for each row execute function set_atualizado_em();
