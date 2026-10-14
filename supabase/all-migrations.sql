-- Sales core: leads, deals, activities, invoices
--
-- Note: table/column names and enum values use Portuguese identifiers and are
-- kept as a stable API (the app and the agents' tools reference them). Glossary:
--   nome = name, empresa = company, telefone = phone, nicho = niche,
--   localidade = location, origem = source, notas = notes, titulo = title,
--   valor_estimado/valor_fechado = estimated/closed value, moeda = currency,
--   tipo_receita = revenue type (recorrente = recurring), etapa = stage,
--   probabilidade = probability, data_fecho_prevista/real = expected/actual close date,
--   motivo_perda = loss reason, tipo = type, descricao = description, custo = cost,
--   data = date, valor = amount, data_emissao/pagamento = issue/payment date.
--   lead_status: novo = new, contactado = contacted, respondeu = replied,
--     reuniao = meeting, desqualificado = disqualified, convertido = converted.
--   deal_etapa: prospeccao = prospecting, contactado = contacted, proposta = proposal,
--     negociacao = negotiation, ganho = won, perdido = lost.
--   activity_tipo: chamada = call, reuniao = meeting, nota = note.
--   invoice_tipo: mensalidade = monthly fee. invoice_status: pendente = pending,
--     paga = paid, atrasada = overdue.

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
  -- direct acquisition cost attached to the activity (ads, tools) — feeds the CAC
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
-- Goals and strategic roadmap
--
-- Glossary (Portuguese identifiers kept as a stable API):
--   goal_metrica: novos_clientes = new customers, reunioes = meetings, receita = revenue.
--   goal_status: ativa = active, atingida = achieved, falhada = missed, arquivada = archived.
--   roadmap_categoria: produto = product, operacoes = operations, financeiro = finance.
--   roadmap_horizonte: agora = now, proximo = next, depois = later.
--   roadmap_status: ideia = idea, planeado = planned, em_curso = in progress, feito = done.
--   valor_alvo = target value, periodo_inicio/fim = period start/end, ordem = sort order.

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
  -- for goals that can't be derived from the data (e.g. "12 books read")
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
-- Agent memory: markdown notes synced from the Obsidian vault
-- + notes written by the agents + knowledge bases.
-- Full-text search uses the 'english' text search config; for notes in another
-- language, change it here (e.g. 'portuguese', 'spanish') and in the
-- .textSearch(..., { config }) calls in src/.

create type memory_source as enum ('vault', 'agent', 'knowledge');

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  -- Obsidian-style path, e.g. "01 - Strategy/ICP.md"
  path text not null unique,
  title text not null,
  content text not null,
  -- '{all}' = visible to every agent; or a list of agent ids, e.g. '{marketing,ads}'
  scope text[] not null default '{all}',
  source memory_source not null default 'vault',
  content_hash text not null,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || content)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_memory_fts on agent_memory using gin(fts);
create index idx_agent_memory_scope on agent_memory using gin(scope);
create index idx_agent_memory_source on agent_memory(source);
-- Conversation history with the agents (titulo = title)

create table conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  titulo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  -- message parts in the AI SDK format (text + tool calls)
  content jsonb not null,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id, created_at);
create index idx_conversations_agent on conversations(agent_id, updated_at desc);
-- KPI views: the SAME source of truth for the dashboard and the agents' tools.
-- View names are kept as a stable API: v_receita_mensal = monthly revenue,
-- v_mrr_atual = current MRR, v_pipeline_resumo = pipeline summary,
-- v_funil_conversao = conversion funnel, v_progresso_metas = goal progress.

-- Revenue per month, splitting recurring (monthly fees) from one-off (setup/extra)
create view v_receita_mensal as
select
  date_trunc('month', data_pagamento)::date as mes,
  sum(valor) filter (where tipo = 'mensalidade') as receita_recorrente,
  sum(valor) filter (where tipo <> 'mensalidade') as receita_pontual,
  sum(valor) as receita_total
from invoices
where status = 'paga' and data_pagamento is not null
group by 1
order by 1;

-- Current MRR = sum of won recurring deals (active contracts)
create view v_mrr_atual as
select
  coalesce(sum(valor_fechado), 0) as mrr,
  count(*) as clientes_ativos,
  coalesce(avg(valor_fechado), 0) as ticket_medio
from deals
where etapa = 'ganho' and tipo_receita = 'recorrente';

-- Pipeline per stage with probability-weighted value
create view v_pipeline_resumo as
select
  etapa,
  count(*) as n_deals,
  coalesce(sum(valor_estimado), 0) as valor_total,
  coalesce(sum(valor_estimado * probabilidade / 100.0), 0) as valor_ponderado
from deals
where etapa not in ('ganho', 'perdido')
group by etapa;

-- Lead conversion funnel (counts per status)
create view v_funil_conversao as
with contagens as (
  select
    count(*) as total,
    count(*) filter (where status <> 'novo') as contactados,
    count(*) filter (where status in ('respondeu', 'reuniao', 'convertido')) as responderam,
    count(*) filter (where status in ('reuniao', 'convertido')) as reunioes,
    count(*) filter (where status = 'convertido') as convertidos
  from leads
)
select
  total, contactados, responderam, reunioes, convertidos,
  round(100.0 * responderam / nullif(contactados, 0), 1) as taxa_resposta_pct,
  round(100.0 * reunioes / nullif(responderam, 0), 1) as taxa_reuniao_pct,
  round(100.0 * convertidos / nullif(reunioes, 0), 1) as taxa_fecho_pct
from contagens;

-- Goal progress: current value derived from the data according to the metric type
create view v_progresso_metas as
select
  g.*,
  case g.tipo_metrica
    when 'mrr' then (select mrr from v_mrr_atual)
    when 'novos_clientes' then (
      select count(*)::numeric from deals d
      where d.etapa = 'ganho'
        and d.data_fecho_real between g.periodo_inicio and g.periodo_fim
    )
    when 'reunioes' then (
      select count(*)::numeric from activities a
      where a.tipo = 'reuniao'
        and a.data between g.periodo_inicio and g.periodo_fim
    )
    when 'receita' then (
      select coalesce(sum(i.valor), 0) from invoices i
      where i.status = 'paga'
        and i.data_pagamento between g.periodo_inicio and g.periodo_fim
    )
    when 'leads' then (
      select count(*)::numeric from leads l
      where l.created_at::date between g.periodo_inicio and g.periodo_fim
    )
    else coalesce(g.valor_atual_manual, 0)
  end as valor_atual,
  round(100.0 * (
    case g.tipo_metrica
      when 'mrr' then (select mrr from v_mrr_atual)
      when 'novos_clientes' then (
        select count(*)::numeric from deals d
        where d.etapa = 'ganho'
          and d.data_fecho_real between g.periodo_inicio and g.periodo_fim
      )
      when 'reunioes' then (
        select count(*)::numeric from activities a
        where a.tipo = 'reuniao'
          and a.data between g.periodo_inicio and g.periodo_fim
      )
      when 'receita' then (
        select coalesce(sum(i.valor), 0) from invoices i
        where i.status = 'paga'
          and i.data_pagamento between g.periodo_inicio and g.periodo_fim
      )
      when 'leads' then (
        select count(*)::numeric from leads l
        where l.created_at::date between g.periodo_inicio and g.periodo_fim
      )
      else coalesce(g.valor_atual_manual, 0)
    end
  ) / nullif(g.valor_alvo, 0), 1) as progresso_pct
from goals g
where g.status = 'ativa';
-- Single-user RLS: full access for any authenticated user.
-- Public sign-ups are disabled in the dashboard, so "authenticated" = the founder.
-- The sync scripts use the service_role key, which bypasses RLS by design.

do $$
declare
  t text;
begin
  foreach t in array array[
    'leads', 'deals', 'activities', 'invoices',
    'goals', 'roadmap_items', 'agent_memory', 'conversations', 'messages'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "authenticated_all" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
