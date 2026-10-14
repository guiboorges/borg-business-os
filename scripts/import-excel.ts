/**
 * Imports prospecting spreadsheets (folder set in LEADS_DIR, in .env.local) into the leads table.
 *
 * - Dry-run by default (shows what it would do); `--commit` actually inserts.
 * - Dedupes by email and by company name (case-insensitive), including
 *   against leads that already exist in the database.
 * - Rows 1-2 of each sheet are a decorative title; headers are on row 3.
 *
 * Expected files and columns (header names must match exactly):
 *
 *   prospects.xlsx — sheet "Prospects"
 *     Business Name (required) · Business Type · Email · Phone · Location ·
 *     Website · Suggested Services
 *
 *   outreach.xlsx — sheet "Outreach"
 *     Business Name (required) · Niche · Location · Contact ·
 *     Problem Identified · Outreach Message · Sent Date · Reply
 *
 * Lead status is derived for the outreach sheet: a Reply → "respondeu" (replied),
 * a Sent Date → "contactado" (contacted), otherwise "novo" (new). These are the
 * values stored in the database (see supabase/migrations/0001_core_tables.sql).
 *
 * Usage: npm run import:leads [-- --commit]
 */
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

const FOLDER = process.env.LEADS_DIR ?? "./data";
const COMMIT = process.argv.includes("--commit");

// Field names match the columns of the `leads` table (Portuguese identifiers):
// nome = name, empresa = company, nicho = niche, telefone = phone,
// localidade = location, origem = source, notas = notes.
interface LeadRow {
  nome: string;
  empresa: string;
  nicho: string | null;
  email: string | null;
  telefone: string | null;
  localidade: string | null;
  website: string | null;
  origem: string;
  status: string;
  notas: string | null;
}

const clean = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s || null;
};

function readProspects(): LeadRow[] {
  const file = join(FOLDER, "prospects.xlsx");
  if (!existsSync(file)) return [];
  const ws = XLSX.readFile(file).Sheets["Prospects"];
  if (!ws) {
    console.warn(`⚠️  ${file}: sheet "Prospects" not found (skipped)`);
    return [];
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 2 });
  return rows
    .filter((r) => clean(r["Business Name"]))
    .map((r) => ({
      nome: clean(r["Business Name"])!,
      empresa: clean(r["Business Name"])!,
      nicho: clean(r["Business Type"]),
      email: clean(r["Email"])?.toLowerCase() ?? null,
      telefone: clean(r["Phone"]),
      localidade: clean(r["Location"]),
      website: clean(r["Website"]),
      origem: "outbound",
      status: "novo",
      notas: clean(r["Suggested Services"])
        ? `Suggested services: ${clean(r["Suggested Services"])}`
        : null,
    }));
}

function readOutreach(): LeadRow[] {
  const file = join(FOLDER, "outreach.xlsx");
  if (!existsSync(file)) return [];
  const ws = XLSX.readFile(file).Sheets["Outreach"];
  if (!ws) {
    console.warn(`⚠️  ${file}: sheet "Outreach" not found (skipped)`);
    return [];
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 2 });
  return rows
    .filter((r) => clean(r["Business Name"]))
    .map((r) => {
      const sent = clean(r["Sent Date"]);
      const reply = clean(r["Reply"]);
      const notes = [
        clean(r["Contact"]) && `Contact: ${clean(r["Contact"])}`,
        clean(r["Problem Identified"]) && `Problem: ${clean(r["Problem Identified"])}`,
        clean(r["Outreach Message"]) && `Message: ${clean(r["Outreach Message"])}`,
        reply && `Reply: ${reply}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      return {
        nome: clean(r["Business Name"])!,
        empresa: clean(r["Business Name"])!,
        nicho: clean(r["Niche"]),
        email: null,
        telefone: null,
        localidade: clean(r["Location"]),
        website: null,
        origem: "outbound",
        status: reply ? "respondeu" : sent ? "contactado" : "novo",
        notas: notes || null,
      };
    });
}

async function main() {
  console.log(`📥 Lead import ${COMMIT ? "(COMMIT)" : "(dry-run — use --commit to insert)"}\n`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: existing, error } = await supabase.from("leads").select("empresa, email");
  if (error) {
    console.error("❌ Error reading existing leads:", error.message);
    process.exit(1);
  }
  const seen = new Set<string>();
  for (const l of existing ?? []) {
    if (l.empresa) seen.add(`co:${l.empresa.toLowerCase()}`);
    if (l.email) seen.add(`em:${l.email.toLowerCase()}`);
  }

  const all = [...readOutreach(), ...readProspects()];
  const fresh: LeadRow[] = [];
  let duplicates = 0;

  for (const lead of all) {
    const kCo = `co:${lead.empresa.toLowerCase()}`;
    const kEm = lead.email ? `em:${lead.email}` : null;
    if (seen.has(kCo) || (kEm && seen.has(kEm))) {
      duplicates++;
      continue;
    }
    seen.add(kCo);
    if (kEm) seen.add(kEm);
    fresh.push(lead);
  }

  console.log(`Read: ${all.length} · New: ${fresh.length} · Duplicates skipped: ${duplicates}\n`);
  for (const l of fresh.slice(0, 10)) {
    console.log(`  + ${l.empresa} (${l.nicho ?? "?"} · ${l.localidade ?? "?"} · ${l.status})`);
  }
  if (fresh.length > 10) console.log(`  … and ${fresh.length - 10} more`);

  if (COMMIT && fresh.length > 0) {
    const { error: insErr } = await supabase.from("leads").insert(fresh);
    if (insErr) {
      console.error("\n❌ Error inserting:", insErr.message);
      process.exit(1);
    }
    console.log(`\n✅ ${fresh.length} leads inserted.`);
  }
}

main();
