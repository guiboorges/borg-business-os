import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/metrics/formulas";
import {
  createDeal,
  createInvoice,
  createLead,
  updateDealEtapa,
  updateLeadStatus,
} from "./actions";

export const dynamic = "force-dynamic";

const ETAPAS = [
  { id: "prospeccao", label: "Prospecção" },
  { id: "contactado", label: "Contactado" },
  { id: "proposta", label: "Proposta" },
  { id: "negociacao", label: "Negociação" },
  { id: "ganho", label: "Ganho ✓" },
] as const;

const LEAD_STATUS = [
  "novo",
  "contactado",
  "respondeu",
  "reuniao",
  "desqualificado",
  "convertido",
] as const;

const inputCls =
  "rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none";
const btnCls =
  "rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: leads }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, titulo, valor_estimado, valor_fechado, etapa, probabilidade, leads(empresa, nome)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, nome, empresa, nicho, localidade, origem, status")
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline</h1>
      </div>

      {/* Formulários de registo rápido */}
      <div className="mt-4 flex flex-wrap gap-4">
        <details className="rounded-lg border border-zinc-800 bg-zinc-900">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-emerald-400">
            + Lead
          </summary>
          <form action={createLead} className="flex flex-wrap items-end gap-2 p-4 pt-1">
            <input name="nome" required placeholder="Nome *" className={inputCls} />
            <input name="empresa" placeholder="Empresa" className={inputCls} />
            <input name="nicho" placeholder="Nicho (ex. estúdio de yoga)" className={inputCls} />
            <input name="localidade" placeholder="Localidade" className={inputCls} />
            <input name="instagram" placeholder="@instagram" className={inputCls} />
            <select name="origem" className={inputCls} defaultValue="outbound">
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
              <option value="referral">Indicação</option>
              <option value="ads">Ads</option>
            </select>
            <button type="submit" className={btnCls}>Guardar</button>
          </form>
        </details>

        <details className="rounded-lg border border-zinc-800 bg-zinc-900">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-emerald-400">
            + Deal
          </summary>
          <form action={createDeal} className="flex flex-wrap items-end gap-2 p-4 pt-1">
            <input name="titulo" required placeholder="Título *" className={inputCls} />
            <select name="lead_id" className={inputCls} defaultValue="">
              <option value="">— sem lead —</option>
              {(leads ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.empresa ?? l.nome}
                </option>
              ))}
            </select>
            <input
              name="valor_estimado"
              type="number"
              step="0.01"
              placeholder="Valor mensal €"
              className={inputCls}
            />
            <select name="tipo_receita" className={inputCls} defaultValue="recorrente">
              <option value="recorrente">Recorrente</option>
              <option value="one_off">Pontual</option>
            </select>
            <button type="submit" className={btnCls}>Guardar</button>
          </form>
        </details>
      </div>

      {/* Kanban */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {ETAPAS.map((etapa) => {
          const items = (deals ?? []).filter((d) => d.etapa === etapa.id);
          return (
            <div key={etapa.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {etapa.label}
                <span className="text-zinc-600">{items.length}</span>
              </h2>
              <div className="space-y-2">
                {items.map((d) => (
                  <div key={d.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-sm font-medium text-white">{d.titulo}</p>
                    <p className="text-xs text-zinc-500">
                      {(d.leads as { empresa?: string; nome?: string } | null)?.empresa ??
                        (d.leads as { nome?: string } | null)?.nome ??
                        ""}
                    </p>
                    <p className="mt-1 text-sm text-emerald-400">
                      {formatEUR(Number(d.valor_fechado ?? d.valor_estimado ?? 0))}
                      {d.etapa !== "ganho" && (
                        <span className="text-zinc-500"> · {d.probabilidade}%</span>
                      )}
                    </p>
                    <form action={updateDealEtapa} className="mt-2 flex gap-1">
                      <input type="hidden" name="deal_id" value={d.id} />
                      <select
                        name="etapa"
                        defaultValue={d.etapa}
                        className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                      >
                        {[...ETAPAS.map((e) => e.id), "perdido"].map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-600"
                      >
                        Mover
                      </button>
                    </form>
                    {d.etapa === "ganho" && (
                      <form action={createInvoice} className="mt-2 flex gap-1">
                        <input type="hidden" name="deal_id" value={d.id} />
                        <input
                          name="valor"
                          type="number"
                          step="0.01"
                          required
                          placeholder="€"
                          className="w-16 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                        />
                        <select
                          name="tipo"
                          defaultValue="mensalidade"
                          className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                        >
                          <option value="mensalidade">Mensalidade</option>
                          <option value="setup">Setup</option>
                          <option value="extra">Extra</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-500"
                        >
                          + Fatura
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-600">vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leads */}
      <h2 className="mt-10 text-lg font-semibold">Leads ({(leads ?? []).length})</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Nicho</th>
              <th className="px-3 py-2">Localidade</th>
              <th className="px-3 py-2">Origem</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((l) => (
              <tr key={l.id} className="border-t border-zinc-800/60">
                <td className="px-3 py-2">{l.nome}</td>
                <td className="px-3 py-2 text-zinc-400">{l.empresa}</td>
                <td className="px-3 py-2 text-zinc-400">{l.nicho}</td>
                <td className="px-3 py-2 text-zinc-400">{l.localidade}</td>
                <td className="px-3 py-2 text-zinc-400">{l.origem}</td>
                <td className="px-3 py-2">
                  <form action={updateLeadStatus} className="flex gap-1">
                    <input type="hidden" name="lead_id" value={l.id} />
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                    >
                      {LEAD_STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-600"
                    >
                      OK
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                  Sem leads — adiciona o primeiro com &quot;+ Lead&quot; ou importa os Excel
                  (Fase 6).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
