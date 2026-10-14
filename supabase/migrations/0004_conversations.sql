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
