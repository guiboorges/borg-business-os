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
-- Memória dos agentes: notas markdown sincronizadas do vault Obsidian
-- + notas escritas pelos agentes + bases de conhecimento

create type memory_source as enum ('vault', 'agent', 'knowledge');

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  -- caminho estilo Obsidian, ex. "03 - Go-To-Market/ICP.md"
  path text not null unique,
  title text not null,
  content text not null,
  -- '{all}' = visível a todos os agentes; ou lista de ids, ex. '{marketing,ads}'
  scope text[] not null default '{all}',
  source memory_source not null default 'vault',
  content_hash text not null,
  fts tsvector generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || content)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_memory_fts on agent_memory using gin(fts);
create index idx_agent_memory_scope on agent_memory using gin(scope);
create index idx_agent_memory_source on agent_memory(source);
-- Histórico de conversas com os agentes

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
  -- partes da mensagem no formato do AI SDK (texto + tool calls)
  content jsonb not null,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id, created_at);
create index idx_conversations_agent on conversations(agent_id, updated_at desc);
-- Views de KPIs: a MESMA fonte de verdade para a dashboard e para as tools dos agentes

-- Receita por mês, separando recorrente (mensalidades) de pontual (setup/extra)
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

-- MRR atual = soma dos deals ganhos recorrentes (contratos ativos)
create view v_mrr_atual as
select
  coalesce(sum(valor_fechado), 0) as mrr,
  count(*) as clientes_ativos,
  coalesce(avg(valor_fechado), 0) as ticket_medio
from deals
where etapa = 'ganho' and tipo_receita = 'recorrente';

-- Pipeline por etapa com valor ponderado por probabilidade
create view v_pipeline_resumo as
select
  etapa,
  count(*) as n_deals,
  coalesce(sum(valor_estimado), 0) as valor_total,
  coalesce(sum(valor_estimado * probabilidade / 100.0), 0) as valor_ponderado
from deals
where etapa not in ('ganho', 'perdido')
group by etapa;

-- Funil de conversão de leads (contagens por status)
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

-- Progresso de metas: valor atual derivado dos dados conforme o tipo de métrica
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
-- RLS single-user: acesso total a qualquer utilizador autenticado.
-- Os signups públicos estão desativados no painel, portanto "autenticado" = o fundador.
-- Scripts de sync usam a service_role key, que contorna RLS por design.

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
