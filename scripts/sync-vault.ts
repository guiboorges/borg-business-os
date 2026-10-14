/**
 * Two-way sync between the Obsidian vault and Supabase (agent_memory).
 *
 * Rules:
 *  - The vault is the source of truth for human notes (source='vault'): the vault always wins.
 *  - Agent notes (source='agent', path under "09 - Agents/") are pulled down into the vault;
 *    if the local file was edited by hand since the last sync, the human edit
 *    is promoted and overwrites the database.
 *  - A local manifest (.sync-manifest.json) stores each note's hash at the last
 *    sync — that is what tells which side a change came from (3-way).
 *
 * Usage: npm run sync [-- --dry-run]
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
const AGENT_FOLDER = "09 - Agents";
const IGNORED_DIRS = new Set([".obsidian", ".agents", ".claude", "Personal"]);
const DRY_RUN = process.argv.includes("--dry-run");

if (!VAULT_PATH || !existsSync(VAULT_PATH)) {
  console.error(`❌ VAULT_PATH not found: ${VAULT_PATH}`);
  process.exit(1);
}

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "❌ Supabase keys missing from .env.local — follow SETUP.md (section 1) first."
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

type Manifest = Record<string, string>; // path → hash at the last sync

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
        `⚠️  File not downloaded from iCloud (skipped): ${relative(VAULT_PATH, join(dir, entry.name))}\n` +
          `   To force the download: brctl download "${join(dir, entry.name.replace(/^\./, "").replace(/\.icloud$/, ""))}"`
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
  if (error) throw new Error(`Error reading agent_memory: ${error.message}`);
  const dbByPath = new Map((dbRows ?? []).map((r) => [r.path, r]));

  // ── 1. Upload: human/knowledge notes from the vault → Supabase (the vault always wins)
  for (const note of localFiles) {
    const db = dbByPath.get(note.path);
    const isAgentNote = note.source === "agent";

    if (isAgentNote) {
      // Agent notes: only uploaded if they were edited by hand since the last sync
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
        console.log(`✍️  promoted (human edit): ${note.path}`);
        newManifest[note.path] = note.hash;
        continue;
      }
      // otherwise it is handled in the download step
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
        if (upErr) throw new Error(`Upsert failed (${note.path}): ${upErr.message}`);
      }
      stats.up++;
      console.log(`⬆️  ${db ? "updated" : "new"}: ${note.path}`);
    } else {
      stats.unchanged++;
    }
    newManifest[note.path] = note.hash;
  }

  // ── 2. Delete: vault notes deleted locally → delete them from the database
  for (const row of dbRows ?? []) {
    if (row.source !== "vault") continue;
    if (!localByPath.has(row.path)) {
      if (!DRY_RUN) {
        await supabase.from("agent_memory").delete().eq("path", row.path);
      }
      stats.deleted++;
      console.log(`🗑️  deleted: ${row.path}`);
    }
  }

  // ── 3. Download: agent notes → vault (Supabase wins, unless a human edit was already promoted)
  for (const row of dbRows ?? []) {
    if (row.source !== "agent") continue;
    const abs = join(VAULT_PATH, row.path);
    const local = localByPath.get(row.path);

    if (local && stats.promoted > 0 && newManifest[row.path]) continue; // already promoted above

    if (!local || local.hash !== row.content_hash) {
      if (!DRY_RUN) {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, row.content, "utf8");
      }
      stats.down++;
      console.log(`⬇️  agent → vault: ${row.path}`);
    }
    newManifest[row.path] = row.content_hash;
  }

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  }

  console.log(
    `\n✅ Sync complete: ${stats.up} uploaded, ${stats.down} downloaded, ` +
      `${stats.promoted} promoted, ${stats.deleted} deleted, ${stats.unchanged} unchanged.`
  );
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
