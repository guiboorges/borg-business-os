/**
 * Copia as bases de conhecimento (knowledge/) para o vault Obsidian em
 * "09 - Agentes/Conhecimento/". Depois corre `npm run sync` para as carregar
 * no Supabase (o frontmatter source_type: knowledge marca-as como conhecimento).
 *
 * Uso: npm run seed:knowledge
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

const VAULT_PATH = process.env.VAULT_PATH!;
const KNOWLEDGE_DIR = resolve(import.meta.dirname, "..", "knowledge");
const DEST = join(VAULT_PATH, "09 - Agentes", "Conhecimento");

if (!VAULT_PATH || !existsSync(VAULT_PATH)) {
  console.error(`❌ VAULT_PATH não encontrado: ${VAULT_PATH}`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

let copiados = 0;
function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (entry.name.endsWith(".md")) {
      copyFileSync(abs, join(DEST, entry.name));
      console.log(`📚 ${entry.name}`);
      copiados++;
    }
  }
}
walk(KNOWLEDGE_DIR);

console.log(`\n✅ ${copiados} ficheiros copiados para o vault em "09 - Agentes/Conhecimento/".`);
console.log("   Agora corre: npm run sync");
