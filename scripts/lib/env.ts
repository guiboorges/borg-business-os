import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Carrega .env.local para process.env (scripts correm fora do Next.js)
export function loadEnv() {
  const envPath = resolve(import.meta.dirname, "../../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}
