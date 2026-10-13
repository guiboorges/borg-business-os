import type { ToolSet } from "ai";

export interface AgentConfig {
  id: string;
  nome: string;
  descricao: string;
  /** Quando usar este agente — mostrado no seletor da UI */
  quandoUsar: string;
  icone: string;
  cor: string;
  /** Persona específica do agente (bloco estável do prompt, cacheável) */
  persona: string;
  /** Paths de notas que o agente deve ler quando o tema justifica */
  notasAncora: string[];
  model: string;
  buildTools: () => ToolSet;
}

// IDs de modelo centralizados (confirmar preços em platform.claude.com/docs)
export const MODELS = {
  /** Padrão dos agentes — claude-sonnet-5: $3/$15 por MTok (intro $2/$10 até 2026-08-31) */
  padrao: "claude-sonnet-5",
  /** Estrategista — claude-opus-5: $5/$25 por MTok */
  estrategista: "claude-opus-5",
  /** Tarefas mecânicas (títulos, resumos) — claude-haiku-4-5: $1/$5 por MTok */
  rapido: "claude-haiku-4-5",
} as const;
