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
