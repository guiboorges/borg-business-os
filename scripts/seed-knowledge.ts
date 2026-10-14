/**
 * Copies the knowledge bases (knowledge/) into the Obsidian vault under
 * "09 - Agents/Knowledge/". Then run `npm run sync` to load them into
 * Supabase (the frontmatter `source_type: knowledge` marks them as knowledge).
 *
 * Usage: npm run seed:knowledge
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

const VAULT_PATH = process.env.VAULT_PATH!;
const KNOWLEDGE_DIR = resolve(import.meta.dirname, "..", "knowledge");
const AGENT_FOLDER = "09 - Agents";
const KNOWLEDGE_FOLDER = "Knowledge";
const DEST = join(VAULT_PATH, AGENT_FOLDER, KNOWLEDGE_FOLDER);

if (!VAULT_PATH || !existsSync(VAULT_PATH)) {
  console.error(`❌ VAULT_PATH not found: ${VAULT_PATH}`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

let copied = 0;
function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (entry.name.endsWith(".md")) {
      copyFileSync(abs, join(DEST, entry.name));
      console.log(`📚 ${entry.name}`);
      copied++;
    }
  }
}
walk(KNOWLEDGE_DIR);

console.log(`\n✅ ${copied} files copied to the vault under "${AGENT_FOLDER}/${KNOWLEDGE_FOLDER}/".`);
console.log("   Now run: npm run sync");
