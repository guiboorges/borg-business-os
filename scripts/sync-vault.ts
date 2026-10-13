/**
 * Sincronização bidirecional vault Obsidian ↔ Supabase (agent_memory).
 *
 * Regras:
 *  - O vault é a fonte de verdade para notas humanas (source='vault'): vault ganha sempre.
 *  - Notas de agentes (source='agent', path em "09 - Agentes/") descem para o vault;
 *    se o ficheiro local foi editado à mão desde a última sync, a edição humana
 *    é promovida e regrava a base de dados.
 *  - Manifesto local (.sync-manifest.json) guarda o hash de cada nota na última
 *    sync — é o que permite distinguir de que lado veio a alteração (3-way).
 *
 * Uso: npm run sync [-- --dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import matter from "gray-matter";
import { loadEnv } from "./lib/env";

loadEnv();

const VAULT_PATH = process.env.VAULT_PATH!;
const MANIFEST_PATH = join(import.meta.dirname, "..", ".sync-manifest.json");
const AGENT_FOLDER = "09 - Agentes";
const IGNORED_DIRS = new Set([".obsidian", ".agents", ".claude", "Personal"]);
const DRY_RUN = process.argv.includes("--dry-run");

if (!VAULT_PATH || !existsSync(VAULT_PATH)) {
  console.error(`❌ VAULT_PATH não encontrado: ${VAULT_PATH}`);
  process.exit(1);
}

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "❌ Chaves Supabase em falta no .env.local — segue o SETUP.md (secção 1) primeiro."
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

type Manifest = Record<string, string>; // path → hash na última sync

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function walkVault(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walkVault(join(dir, entry.name), files);
    } else if (entry.name.endsWith(".md")) {
      files.push(join(dir, entry.name));
    } else if (entry.name.endsWith(".icloud")) {
      console.warn(
        `⚠️  Ficheiro não descarregado do iCloud (ignorado): ${relative(VAULT_PATH, join(dir, entry.name))}\n` +
          `   Para forçar o download: brctl download "${join(dir, entry.name.replace(/^\./, "").replace(/\.icloud$/, ""))}"`
      );
    }
  }
  return files;
}

function parseNote(absPath: string) {
  const raw = readFileSync(absPath, "utf8");
  const path = relative(VAULT_PATH, absPath);
  const { data } = matter(raw);
  const scope: string[] = Array.isArray(data.scope)
    ? data.scope.map(String)
    : ["all"];
  const title: string = data.title || basename(path, ".md");
  const source =
    data.source_type === "knowledge"
      ? "knowledge"
      : path.startsWith(AGENT_FOLDER + "/")
        ? "agent"
        : "vault";
  return { path, title, content: raw, scope, source, hash: sha256(raw) };
}

async function main() {
  console.log(`🔄 Sync vault ↔ Supabase ${DRY_RUN ? "(dry-run)" : ""}`);
  console.log(`   Vault: ${VAULT_PATH}\n`);

  const manifest = loadManifest();
  const newManifest: Manifest = {};
  const stats = { up: 0, down: 0, promoted: 0, deleted: 0, unchanged: 0 };

  const localFiles = walkVault(VAULT_PATH).map(parseNote);
  const localByPath = new Map(localFiles.map((f) => [f.path, f]));

  const { data: dbRows, error } = await supabase
    .from("agent_memory")
    .select("path, content, content_hash, source, scope, title");
  if (error) throw new Error(`Erro a ler agent_memory: ${error.message}`);
  const dbByPath = new Map((dbRows ?? []).map((r) => [r.path, r]));

  // ── 1. Upload: notas humanas/conhecimento do vault → Supabase (vault ganha sempre)
  for (const note of localFiles) {
    const db = dbByPath.get(note.path);
    const isAgentNote = note.source === "agent";

    if (isAgentNote) {
      // Notas de agentes: só sobem se foram editadas à mão desde a última sync
      const lastSynced = manifest[note.path];
      if (db && lastSynced && note.hash !== lastSynced && note.hash !== db.content_hash) {
        if (!DRY_RUN) {
          await supabase
            .from("agent_memory")
            .update({
              content: note.content,
              title: note.title,
              content_hash: note.hash,
              updated_at: new Date().toISOString(),
            })
            .eq("path", note.path);
        }
        stats.promoted++;
        console.log(`✍️  promovida (edição humana): ${note.path}`);
        newManifest[note.path] = note.hash;
        continue;
      }
      // caso contrário é tratada no passo de download
      continue;
    }

    if (!db || db.content_hash !== note.hash) {
      if (!DRY_RUN) {
        const { error: upErr } = await supabase.from("agent_memory").upsert(
          {
            path: note.path,
            title: note.title,
            content: note.content,
            scope: note.scope,
            source: note.source,
            content_hash: note.hash,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "path" }
        );
        if (upErr) throw new Error(`Upsert falhou (${note.path}): ${upErr.message}`);
      }
      stats.up++;
      console.log(`⬆️  ${db ? "atualizada" : "nova"}: ${note.path}`);
    } else {
      stats.unchanged++;
    }
    newManifest[note.path] = note.hash;
  }

  // ── 2. Delete: notas de vault apagadas localmente → apagar na base de dados
  for (const row of dbRows ?? []) {
    if (row.source !== "vault") continue;
    if (!localByPath.has(row.path)) {
      if (!DRY_RUN) {
        await supabase.from("agent_memory").delete().eq("path", row.path);
      }
      stats.deleted++;
      console.log(`🗑️  apagada: ${row.path}`);
    }
  }

  // ── 3. Download: notas de agentes → vault (Supabase ganha, salvo edição humana já promovida)
  for (const row of dbRows ?? []) {
    if (row.source !== "agent") continue;
    const abs = join(VAULT_PATH, row.path);
    const local = localByPath.get(row.path);

    if (local && stats.promoted > 0 && newManifest[row.path]) continue; // já promovida acima

    if (!local || local.hash !== row.content_hash) {
      if (!DRY_RUN) {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, row.content, "utf8");
      }
      stats.down++;
      console.log(`⬇️  agente → vault: ${row.path}`);
    }
    newManifest[row.path] = row.content_hash;
  }

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  }

  console.log(
    `\n✅ Sync completo: ${stats.up} subidas, ${stats.down} descidas, ` +
      `${stats.promoted} promovidas, ${stats.deleted} apagadas, ${stats.unchanged} sem alteração.`
  );
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
