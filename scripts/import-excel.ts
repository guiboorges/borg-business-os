/**
 * Importa os Excel de prospecção (pasta em LEADS_DIR, no .env.local) para a tabela leads.
 *
 * - Dry-run por defeito (mostra o que faria); `--commit` insere de verdade.
 * - Dedupe por email e por nome de empresa (case-insensitive), incluindo
 *   contra leads já existentes na base de dados.
 * - As linhas 1-2 dos ficheiros são título decorativo; cabeçalhos na linha 3.
 *
 * Uso: npm run import:leads [-- --commit]
 */
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

const PASTA = process.env.LEADS_DIR ?? "./dados";
const COMMIT = process.argv.includes("--commit");

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

function lerProspectos(): LeadRow[] {
  const file = join(PASTA, "prospectos.xlsx");
  if (!existsSync(file)) return [];
  const ws = XLSX.readFile(file).Sheets["Prospectos"];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 2 });
  return rows
    .filter((r) => clean(r["Nome do Negócio"]))
    .map((r) => ({
      nome: clean(r["Nome do Negócio"])!,
      empresa: clean(r["Nome do Negócio"])!,
      nicho: clean(r["Tipo de Negócio"]),
      email: clean(r["Email"])?.toLowerCase() ?? null,
      telefone: clean(r["Telefone"]),
      localidade: clean(r["Localidade"]),
      website: clean(r["Website"]),
      origem: "outbound",
      status: "novo",
      notas: clean(r["Serviços Sugeridos"])
        ? `Serviços sugeridos: ${clean(r["Serviços Sugeridos"])}`
        : null,
    }));
}

function lerProspeccao2026(): LeadRow[] {
  const file = join(PASTA, "prospeccao.xlsx");
  if (!existsSync(file)) return [];
  const ws = XLSX.readFile(file).Sheets["Prospecção Comercial"];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 2 });
  return rows
    .filter((r) => clean(r["Nome do Negócio"]))
    .map((r) => {
      const enviado = clean(r["Data de Envio"]);
      const resposta = clean(r["Resposta"]);
      const notas = [
        clean(r["Contacto"]) && `Contacto: ${clean(r["Contacto"])}`,
        clean(r["Problema Identificado"]) && `Problema: ${clean(r["Problema Identificado"])}`,
        clean(r["Mensagem de Abordagem"]) && `Mensagem: ${clean(r["Mensagem de Abordagem"])}`,
        resposta && `Resposta: ${resposta}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      return {
        nome: clean(r["Nome do Negócio"])!,
        empresa: clean(r["Nome do Negócio"])!,
        nicho: clean(r["Nicho"]),
        email: null,
        telefone: null,
        localidade: clean(r["Localização"]),
        website: null,
        origem: "outbound",
        status: resposta ? "respondeu" : enviado ? "contactado" : "novo",
        notas: notas || null,
      };
    });
}

async function main() {
  console.log(`📥 Importação de leads ${COMMIT ? "(COMMIT)" : "(dry-run — usa --commit para inserir)"}\n`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: existentes, error } = await supabase.from("leads").select("empresa, email");
  if (error) {
    console.error("❌ Erro a ler leads existentes:", error.message);
    process.exit(1);
  }
  const vistos = new Set<string>();
  for (const l of existentes ?? []) {
    if (l.empresa) vistos.add(`emp:${l.empresa.toLowerCase()}`);
    if (l.email) vistos.add(`eml:${l.email.toLowerCase()}`);
  }

  const todos = [...lerProspeccao2026(), ...lerProspectos()];
  const novos: LeadRow[] = [];
  let duplicados = 0;

  for (const lead of todos) {
    const kEmp = `emp:${lead.empresa.toLowerCase()}`;
    const kEml = lead.email ? `eml:${lead.email}` : null;
    if (vistos.has(kEmp) || (kEml && vistos.has(kEml))) {
      duplicados++;
      continue;
    }
    vistos.add(kEmp);
    if (kEml) vistos.add(kEml);
    novos.push(lead);
  }

  console.log(`Lidos: ${todos.length} · Novos: ${novos.length} · Duplicados ignorados: ${duplicados}\n`);
  for (const l of novos.slice(0, 10)) {
    console.log(`  + ${l.empresa} (${l.nicho ?? "?"} · ${l.localidade ?? "?"} · ${l.status})`);
  }
  if (novos.length > 10) console.log(`  … e mais ${novos.length - 10}`);

  if (COMMIT && novos.length > 0) {
    const { error: insErr } = await supabase.from("leads").insert(novos);
    if (insErr) {
      console.error("\n❌ Erro ao inserir:", insErr.message);
      process.exit(1);
    }
    console.log(`\n✅ ${novos.length} leads inseridos.`);
  }
}

main();
