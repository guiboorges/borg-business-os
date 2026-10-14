---
title: Architecture Decisions — BORG Business OS
scope: [all]
source_type: reference
origin: Architecture research, 2026-08-08. Internal engineering document (not business knowledge for the agents).
---

# Architecture Decisions

Summary of the decisions (full report in the research session of 2026-08-08):

| Layer | Choice | Reason |
|---|---|---|
| Frontend + backend | Next.js 15 (App Router) on Vercel | Best AI ecosystem, 1 deploy |
| Data, auth, realtime | Supabase (Postgres + Auth + RLS + Realtime) | Relational SQL for pipeline/revenue, auth out of the box |
| Streaming chat | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | `useChat` + `streamText` + multi-step tool loop |
| Agent runtime | A single parameterised route handler, NO orchestration framework | Anthropic's recommendation: simple, composable patterns |
| Memory | Markdown notes in Postgres + agentic search (full-text search) | Just-in-time context > RAG for a small corpus (~120 notes); no pgvector at first |
| Model | Sonnet by default; optional higher tier for the Strategist; Haiku for mechanical tasks | Cost/latency |

## Critical points
- **Prompt caching**: stable prefix (system + tools) first; dynamic context as a message, never in the system prompt — without this, cost multiplies 3-5x.
- **Obsidian vault ↔ Supabase sync**: the vault is the source of truth; `.sync-manifest.json` manifest (3-way with the hash from the last sync); agent notes live in `09 - Agents/`; human edits always win. The sync runs only on the Mac (the iCloud vault is local).
- **The human vault is read-only for agents** — `memory_write` is restricted to `09 - Agents/<agent_id>/`.
- **Single source of truth for metrics**: formulas in `src/lib/metrics/formulas.ts` + SQL views; the UI and the tools consume the same thing.
- **service_role** server-side only; single-user RLS on every table.
- **Upgrade path**: pgvector (included in the free tier) only if memory grows beyond ~500 notes — add an embedding column + a `memory_semantic_search` tool, no migration of existing data.
- **Costs**: Supabase free (pauses after 7 days of inactivity — mitigate with a weekly GitHub Action), Vercel Hobby, API ~US$10-60/month with caching.
