import { createClient } from "@/lib/supabase/server";
import { createRoadmapItem, updateRoadmapItem } from "./actions";

export const dynamic = "force-dynamic";

const HORIZONTES = [
  { id: "agora", label: "Agora" },
  { id: "proximo", label: "Próximo" },
  { id: "depois", label: "Depois" },
] as const;

const CATEGORIA_CORES: Record<string, string> = {
  produto: "bg-blue-500/15 text-blue-300",
  gtm: "bg-emerald-500/15 text-emerald-300",
  operacoes: "bg-amber-500/15 text-amber-300",
  financeiro: "bg-purple-500/15 text-purple-300",
};

const inputCls =
  "rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("roadmap_items")
    .select("*")
    .neq("status", "feito")
    .order("ordem")
    .order("created_at");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Roadmap</h1>

      <details className="mt-4 max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-emerald-400">
          + Item
        </summary>
        <form action={createRoadmapItem} className="flex flex-wrap items-end gap-2 p-4 pt-1">
          <input name="titulo" required placeholder="Título *" className={inputCls} />
          <input name="descricao" placeholder="Descrição" className={`${inputCls} w-64`} />
          <select name="categoria" className={inputCls} defaultValue="gtm">
            <option value="produto">Produto</option>
            <option value="gtm">Go-To-Market</option>
            <option value="operacoes">Operações</option>
            <option value="financeiro">Financeiro</option>
          </select>
          <select name="horizonte" className={inputCls} defaultValue="proximo">
            {HORIZONTES.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Guardar
          </button>
        </form>
      </details>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {HORIZONTES.map((h) => {
          const colItems = (items ?? []).filter((i) => i.horizonte === h.id);
          return (
            <div key={h.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {h.label} · {colItems.length}
              </h2>
              <div className="space-y-2">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.titulo}</p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORIA_CORES[item.categoria] ?? ""}`}
                      >
                        {item.categoria}
                      </span>
                    </div>
                    {item.descricao && (
                      <p className="mt-1 text-xs text-zinc-500">{item.descricao}</p>
                    )}
                    <form action={updateRoadmapItem} className="mt-2 flex gap-1">
                      <input type="hidden" name="item_id" value={item.id} />
                      <select
                        name="horizonte"
                        defaultValue={item.horizonte}
                        className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                      >
                        {HORIZONTES.map((hh) => (
                          <option key={hh.id} value={hh.id}>{hh.label}</option>
                        ))}
                      </select>
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs"
                      >
                        <option value="ideia">ideia</option>
                        <option value="planeado">planeado</option>
                        <option value="em_curso">em curso</option>
                        <option value="feito">feito</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-600"
                      >
                        OK
                      </button>
                    </form>
                  </div>
                ))}
                {colItems.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-600">vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
