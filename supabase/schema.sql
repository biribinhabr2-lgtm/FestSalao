-- ═══════════════════════════════════════════════════════════
-- FestEventos — Schema Supabase (PostgreSQL + RLS)
-- Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════════════

-- Extensões
create extension if not exists "uuid-ossp";

-- ─── Empresas ────────────────────────────────────────────
create table if not exists empresas (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  segmento    text default 'Brinquedoteca',
  cnpj        text,
  email       text,
  telefone    text,
  endereco    text,
  criado_em   timestamptz default now()
);

-- ─── Usuários (profiles) ─────────────────────────────────
create table if not exists usuarios (
  id          uuid primary key references auth.users on delete cascade,
  empresa_id  uuid references empresas(id) on delete cascade,
  nome        text not null,
  cargo       text,
  setor       text,
  role        text not null check (role in ('admin','funcionario')) default 'funcionario',
  ativo       boolean default true,
  criado_em   timestamptz default now()
);

-- ─── Setores ─────────────────────────────────────────────
create table if not exists setores (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid references empresas(id) on delete cascade,
  nome        text not null,
  ativo       boolean default true
);

-- ─── Cargos ──────────────────────────────────────────────
create table if not exists cargos (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid references empresas(id) on delete cascade,
  nome        text not null,
  ativo       boolean default true
);

-- ─── Tipos de jornada ────────────────────────────────────
create table if not exists tipos_jornada (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid references empresas(id) on delete cascade,
  nome        text not null,
  horario     text,            -- "08:00–14:00"
  cor         text default '#F97316'
);

-- ─── Escalas ─────────────────────────────────────────────
create table if not exists escalas (
  id                uuid primary key default uuid_generate_v4(),
  empresa_id        uuid references empresas(id) on delete cascade,
  funcionario_id    uuid references usuarios(id) on delete cascade,
  data              date not null,
  turno             text not null,
  horario           text,
  setor             text,
  tipo              text default 'Normal',
  observacoes       text,
  criado_por        uuid references usuarios(id),
  criado_em         timestamptz default now()
);

create index on escalas(empresa_id, data);

-- ─── Eventos ─────────────────────────────────────────────
create table if not exists eventos (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid references empresas(id) on delete cascade,
  nome            text not null,
  tipo            text default 'Aniversário',
  data            date not null,
  horario_prep    time,
  horario_inicio  time,
  horario_fim     time,
  status          text default 'Agendado' check (status in ('Agendado','Em andamento','Concluído','Cancelado')),
  criancas        int default 0,
  observacoes     text,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz default now()
);

create index on eventos(empresa_id, data);

create table if not exists evento_responsaveis (
  id            uuid primary key default uuid_generate_v4(),
  evento_id     uuid references eventos(id) on delete cascade,
  usuario_id    uuid references usuarios(id) on delete cascade,
  etapa         text  -- 'preparacao', 'execucao', 'encerramento'
);

-- ─── Avisos ──────────────────────────────────────────────
create table if not exists avisos (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid references empresas(id) on delete cascade,
  titulo          text not null,
  mensagem        text not null,
  tipo            text default 'Geral' check (tipo in ('Geral','Setor','Cargo','Urgente')),
  prioridade      text default 'normal' check (prioridade in ('normal','alta','urgente')),
  destinatarios   text default 'Todos',
  expira_em       date,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz default now()
);

create table if not exists aviso_leituras (
  aviso_id    uuid references avisos(id) on delete cascade,
  usuario_id  uuid references usuarios(id) on delete cascade,
  lido_em     timestamptz default now(),
  primary key (aviso_id, usuario_id)
);

-- ─── Checklist modelos ───────────────────────────────────
create table if not exists checklist_modelos (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid references empresas(id) on delete cascade,
  nome          text not null,
  setor         text,
  recorrencia   text default 'Diária',
  ativo         boolean default true,
  criado_em     timestamptz default now()
);

create table if not exists checklist_itens_modelo (
  id            uuid primary key default uuid_generate_v4(),
  modelo_id     uuid references checklist_modelos(id) on delete cascade,
  descricao     text not null,
  obrigatorio   boolean default false,
  ordem         int default 0
);

create table if not exists checklist_execucoes (
  id            uuid primary key default uuid_generate_v4(),
  modelo_id     uuid references checklist_modelos(id),
  empresa_id    uuid references empresas(id) on delete cascade,
  responsavel_id uuid references usuarios(id),
  data          date not null default current_date,
  status        text default 'Pendente' check (status in ('Pendente','Em andamento','Concluído')),
  criado_em     timestamptz default now()
);

create table if not exists checklist_itens_execucao (
  id              uuid primary key default uuid_generate_v4(),
  execucao_id     uuid references checklist_execucoes(id) on delete cascade,
  item_modelo_id  uuid references checklist_itens_modelo(id),
  descricao       text not null,
  feito           boolean default false,
  feito_em        timestamptz,
  feito_por       uuid references usuarios(id)
);

-- ─── Financeiro ──────────────────────────────────────────
create table if not exists categorias_financeiras (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid references empresas(id) on delete cascade,
  nome        text not null,
  tipo        text check (tipo in ('entrada','saida')),
  cor         text default '#6B7280'
);

create table if not exists movimentacoes_caixa (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid references empresas(id) on delete cascade,
  tipo        text not null check (tipo in ('entrada','saida')),
  descricao   text not null,
  categoria   text,
  valor       numeric(10,2) not null check (valor > 0),
  data        date not null default current_date,
  obs         text,
  criado_por  uuid references usuarios(id),
  criado_em   timestamptz default now()
);

create index on movimentacoes_caixa(empresa_id, data);

create table if not exists fechamentos_caixa (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid references empresas(id) on delete cascade,
  data            date not null,
  saldo_sistema   numeric(10,2),
  saldo_fisico    numeric(10,2),
  diferenca       numeric(10,2) generated always as (saldo_fisico - saldo_sistema) stored,
  observacoes     text,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table empresas                enable row level security;
alter table usuarios                enable row level security;
alter table setores                 enable row level security;
alter table cargos                  enable row level security;
alter table tipos_jornada           enable row level security;
alter table escalas                 enable row level security;
alter table eventos                 enable row level security;
alter table evento_responsaveis     enable row level security;
alter table avisos                  enable row level security;
alter table aviso_leituras          enable row level security;
alter table checklist_modelos       enable row level security;
alter table checklist_itens_modelo  enable row level security;
alter table checklist_execucoes     enable row level security;
alter table checklist_itens_execucao enable row level security;
alter table categorias_financeiras  enable row level security;
alter table movimentacoes_caixa     enable row level security;
alter table fechamentos_caixa       enable row level security;

-- Helper: get empresa_id do usuário logado
create or replace function get_my_empresa_id()
returns uuid language sql security definer stable as $$
  select empresa_id from usuarios where id = auth.uid()
$$;

-- Helper: is admin?
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select role = 'admin' from usuarios where id = auth.uid()
$$;

-- Políticas gerais: isolar por empresa
do $$ declare t text; begin
  foreach t in array array[
    'setores','cargos','tipos_jornada','escalas','eventos',
    'avisos','checklist_modelos','checklist_execucoes',
    'categorias_financeiras','movimentacoes_caixa','fechamentos_caixa'
  ] loop
    execute format('create policy "empresa_isolado_%s" on %I for all using (empresa_id = get_my_empresa_id())', t, t);
  end loop;
end $$;

-- Usuarios: ver apenas da mesma empresa
create policy "usuarios_empresa" on usuarios
  for all using (empresa_id = get_my_empresa_id());

-- Aviso leituras: próprias leituras
create policy "aviso_leituras_proprias" on aviso_leituras
  for all using (usuario_id = auth.uid());

-- Evento responsaveis
create policy "evento_resp_empresa" on evento_responsaveis
  for all using (
    exists (select 1 from eventos e where e.id = evento_id and e.empresa_id = get_my_empresa_id())
  );

-- Checklist itens
create policy "cl_itens_modelo_empresa" on checklist_itens_modelo
  for all using (
    exists (select 1 from checklist_modelos m where m.id = modelo_id and m.empresa_id = get_my_empresa_id())
  );

create policy "cl_itens_exec_empresa" on checklist_itens_execucao
  for all using (
    exists (select 1 from checklist_execucoes e where e.id = execucao_id and e.empresa_id = get_my_empresa_id())
  );

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: criar perfil ao registrar usuário
-- ═══════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into usuarios (id, empresa_id, nome, cargo, setor, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'empresa_id')::uuid,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'cargo', 'Funcionário'),
    coalesce(new.raw_user_meta_data->>'setor', 'Geral'),
    coalesce(new.raw_user_meta_data->>'role', 'funcionario')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- DADOS INICIAIS DE EXEMPLO (opcional)
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO empresas (nome, segmento) VALUES ('Brinquedoteca Alegria', 'Brinquedoteca');
