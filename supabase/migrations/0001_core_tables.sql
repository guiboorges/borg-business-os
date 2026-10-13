-- Núcleo de vendas: leads, deals, activities, invoices

create type lead_origem as enum ('outbound', 'inbound', 'referral', 'ads');
create type lead_status as enum ('novo', 'contactado', 'respondeu', 'reuniao', 'desqualificado', 'convertido');
create type deal_etapa as enum ('prospeccao', 'contactado', 'proposta', 'negociacao', 'ganho', 'perdido');
create type tipo_receita as enum ('one_off', 'recorrente');
create type activity_tipo as enum ('email', 'chamada', 'reuniao', 'followup', 'dm', 'nota');
create type invoice_tipo as enum ('setup', 'mensalidade', 'extra');
create type invoice_status as enum ('pendente', 'paga', 'atrasada');

create table leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  email text,
  telefone text,
  website text,
  instagram text,
  nicho text,
  localidade text,
  origem lead_origem not null default 'outbound',
  status lead_status not null default 'novo',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  titulo text not null,
  valor_estimado numeric(10,2),
  valor_fechado numeric(10,2),
  moeda text not null default 'EUR',
  tipo_receita tipo_receita not null default 'recorrente',
  etapa deal_etapa not null default 'prospeccao',
  probabilidade int not null default 20 check (probabilidade between 0 and 100),
  data_fecho_prevista date,
  data_fecho_real date,
  motivo_perda text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  tipo activity_tipo not null default 'nota',
  descricao text not null,
  -- custo direto de aquisição associado (ads, ferramentas) — alimenta o CAC
  custo numeric(10,2),
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete set null,
  valor numeric(10,2) not null,
  tipo invoice_tipo not null default 'mensalidade',
  data_emissao date not null default current_date,
  data_pagamento date,
  status invoice_status not null default 'pendente',
  created_at timestamptz not null default now()
);

create index idx_deals_etapa on deals(etapa);
create index idx_activities_lead on activities(lead_id);
create index idx_invoices_status_data on invoices(status, data_pagamento);
