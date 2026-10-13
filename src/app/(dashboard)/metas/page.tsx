import { createClient } from "@/lib/supabase/server";
import { NEGOCIO } from "@/config/negocio";
import { createGoal, updateGoalStatus } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none";

const METRICAS: Record<string, string> = {
  mrr: "MRR (€)",
  novos_clientes: "Novos clientes",
  reunioes: "Reuniões",
  receita: "Receita (€)",
  leads: "Leads",
  custom: "Manual",
};

export default async function MetasPage() {
  const supabase = await createClient();
  const { data: metas } = await supabase
    .from("v_progresso_metas")
    .select("*")
    .order("periodo_fim");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Metas</h1>
      <p className="mt-1 text-sm text-zinc-400">
        O progresso é calculado automaticamente a partir dos dados reais
        (exceto metas manuais).
      </p>

      <details className="mt-4 max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-emerald-400">
          + Meta
        </summary>
        <form action={createGoal} className="flex flex-wrap items-end gap-2 p-4 pt-1">
          <input name="titulo" required placeholder="Título *" className={inputCls} />
          <select name="tipo_metrica" className={inputCls} defaultValue="mrr">
            {Object.entries(METRICAS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            name="valor_alvo"
            type="number"
            step="0.01"
            required
            placeholder="Alvo *"
            className={inputCls}
          />
          <label className="text-xs text-zinc-500">
            Início
            <input name="periodo_inicio" type="date" required className={`${inputCls} block`} />
          </label>
          <label className="text-xs text-zinc-500">
            Fim
            <input name="periodo_fim" type="date" required className={`${inputCls} block`} />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Guardar
          </button>
        </form>
      </details>

      <div className="mt-6 max-w-3xl space-y-3">
        {(metas ?? []).map((m) => {
          const pct = Math.min(Number(m.progresso_pct ?? 0), 100);
          return (
            <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{m.titulo}</p>
                <p className="text-sm text-zinc-400">
                  {Number(m.valor_atual ?? 0).toLocaleString("pt-PT")} /{" "}
                  {Number(m.valor_alvo).toLocaleString("pt-PT")}{" "}
                  <span className="text-emerald-400">({pct}%)</span>
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {METRICAS[m.tipo_metrica] ?? m.tipo_metrica} · {m.periodo_inicio} →{" "}
                  {m.periodo_fim}
                </span>
                <form action={updateGoalStatus} className="flex gap-1">
                  <input type="hidden" name="goal_id" value={m.id} />
                  <select
                    name="status"
                    defaultValue={m.status}
                    className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                  >
                    <option value="ativa">ativa</option>
                    <option value="atingida">atingida</option>
                    <option value="falhada">falhada</option>
                    <option value="arquivada">arquivada</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-zinc-700 px-2 py-0.5 hover:bg-zinc-600"
                  >
                    OK
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {(metas ?? []).length === 0 && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            Sem metas ativas — cria a primeira (ex.: {NEGOCIO.metaCurta}).
          </p>
        )}
      </div>
    </div>
  );
}
