-- Metas e road-map estratégico

create type goal_metrica as enum ('mrr', 'novos_clientes', 'reunioes', 'receita', 'leads', 'custom');
create type goal_status as enum ('ativa', 'atingida', 'falhada', 'arquivada');
create type roadmap_categoria as enum ('produto', 'gtm', 'operacoes', 'financeiro');
create type roadmap_horizonte as enum ('agora', 'proximo', 'depois');
create type roadmap_status as enum ('ideia', 'planeado', 'em_curso', 'feito');

create table goals (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo_metrica goal_metrica not null default 'custom',
  valor_alvo numeric(12,2) not null,
  -- para metas não deriváveis dos dados (ex.: "12 livros lidos")
  valor_atual_manual numeric(12,2),
  periodo_inicio date not null,
  periodo_fim date not null,
  parent_goal_id uuid references goals(id) on delete set null,
  status goal_status not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria roadmap_categoria not null default 'gtm',
  horizonte roadmap_horizonte not null default 'proximo',
  status roadmap_status not null default 'planeado',
  ordem int not null default 0,
  goal_id uuid references goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
