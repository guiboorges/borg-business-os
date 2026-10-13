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
