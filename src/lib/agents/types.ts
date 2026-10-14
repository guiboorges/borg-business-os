import type { ToolSet } from "ai";

export interface AgentConfig {
  /** Stable id — used in the /chat/[agent] route and the agent's memory folder */
  id: string;
  /** Display name */
  name: string;
  description: string;
  /** When to use this agent — shown in the UI picker */
  whenToUse: string;
  icon: string;
  color: string;
  /** Agent-specific persona (stable, cacheable block of the prompt) */
  persona: string;
  /** Paths of notes the agent should read when the topic calls for it */
  anchorNotes: string[];
  model: string;
  buildTools: () => ToolSet;
}

// Centralised model IDs (confirm pricing at platform.claude.com/docs)
export const MODELS = {
  /** Default for the agents — claude-sonnet-5: $3/$15 per MTok (intro $2/$10 until 2026-08-31) */
  standard: "claude-sonnet-5",
  /** Strategist — claude-opus-5: $5/$25 per MTok */
  strategist: "claude-opus-5",
  /** Mechanical tasks (titles, summaries) — claude-haiku-4-5: $1/$5 per MTok */
  fast: "claude-haiku-4-5",
} as const;
