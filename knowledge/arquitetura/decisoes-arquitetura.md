---
title: Decisões de Arquitetura — BORG Business OS
scope: [all]
source_type: reference
origem: Pesquisa de arquitetura, 2026-08-08. Documento interno de engenharia (não é conhecimento de negócio dos agentes).
---

# Decisões de Arquitetura

Resumo das decisões (relatório completo na pesquisa da sessão de 2026-08-08):

| Camada | Escolha | Razão |
|---|---|---|
| Frontend + backend | Next.js 15 (App Router) na Vercel | Melhor ecossistema de IA, 1 deploy |
| Dados, auth, realtime | Supabase (Postgres + Auth + RLS + Realtime) | SQL relacional para pipeline/receita, auth pronta |
| Chat streaming | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | `useChat` + `streamText` + loop de tools multi-step |
| Runtime dos agentes | Route handler único parametrizado, SEM framework de orquestração | Recomendação da Anthropic: padrões simples e composáveis |
| Memória | Notas markdown no Postgres + agentic search (FTS português) | Just-in-time context > RAG para corpus pequeno (~120 notas); sem pgvector no início |
| Modelo | Sonnet padrão; tier superior opcional no Estrategista; Haiku para tarefas mecânicas | Custo/latência |

## Pontos críticos
- **Prompt caching**: prefixo estável (system + tools) primeiro; contexto dinâmico como mensagem, nunca no system — sem isso o custo multiplica 3-5x.
- **Sync vault Obsidian ↔ Supabase**: vault é fonte de verdade; manifesto `.sync-manifest.json` (3-way com hash da última sync); notas de agentes vivem em `09 - Agentes/`; edição humana ganha sempre. Sync roda só no Mac (vault iCloud é local).
- **Vault humano é read-only para agentes** — `memory_write` restrito a `09 - Agentes/<agent_id>/`.
- **Verdade única de métricas**: fórmulas em `src/lib/metrics/formulas.ts` + views SQL; UI e tools consomem o mesmo.
- **service_role** apenas server-side; RLS single-user em todas as tabelas.
- **Upgrade path**: pgvector (incluído no free tier) só se memória passar de ~500 notas — adicionar coluna embedding + tool `memory_semantic_search`, sem migração.
- **Custos**: Supabase free (pausa após 7 dias inativo — mitigar com GitHub Action semanal), Vercel Hobby, API ~US$10-60/mês com caching.
