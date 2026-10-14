import type { AgentConfig } from "./types";
import { gestao } from "./gestao";
import { metas } from "./metas";
import { marketing } from "./marketing";
import { aquisicao } from "./aquisicao";
import { ads } from "./ads";
import { estrategista } from "./estrategista";

// Keys are the stable agent ids (used in /chat/[agent] and the memory folder).
export const AGENTS: Record<string, AgentConfig> = {
  gestao,
  metas,
  marketing,
  aquisicao,
  ads,
  estrategista,
};

export function getAgent(id: string): AgentConfig | null {
  return AGENTS[id] ?? null;
}
