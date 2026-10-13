import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Bot, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

const sourceBadge = {
  vault: { label: "Vault", icon: BookOpen, cls: "bg-blue-500/15 text-blue-300" },
  agent: { label: "Agente", icon: Bot, cls: "bg-emerald-500/15 text-emerald-300" },
  knowledge: {
    label: "Conhecimento",
    icon: GraduationCap,
    cls: "bg-amber-500/15 text-amber-300",
  },
} as const;

export default async function MemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nota?: string }>;
}) {
  const { q, nota } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("agent_memory")
    .select("path, title, source, scope, updated_at")
    .order("path");

  if (q) {
    query = supabase
      .from("agent_memory")
      .select("path, title, source, scope, updated_at")
      .textSearch("fts", q, { type: "websearch", config: "portuguese" })
      .order("path");
  }

  const { data: notas, error } = await query;

  let notaAberta: { path: string; content: string } | null = null;
  if (nota) {
    const { data } = await supabase
      .from("agent_memory")
      .select("path, content")
      .eq("path", nota)
      .single();
    notaAberta = data;
  }

  // Agrupar por pasta de topo
  const grupos = new Map<string, NonNullable<typeof notas>>();
  for (const n of notas ?? []) {
    const pasta = n.path.includes("/") ? n.path.split("/")[0] : "(raiz)";
    if (!grupos.has(pasta)) grupos.set(pasta, []);
    grupos.get(pasta)!.push(n);
  }

  return (
    <div className="flex h-screen">
      <div className="w-96 shrink-0 overflow-y-auto border-r border-zinc-800 p-4">
        <h1 className="mb-3 text-lg font-bold">Memória</h1>

        <form method="GET" className="mb-4">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar nas notas…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>

        {error && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Sem ligação à base de dados — completa o SETUP.md e corre as
            migrations + <code>npm run sync</code>.
          </p>
        )}

        {!error && (notas?.length ?? 0) === 0 && (
          <p className="text-sm text-zinc-500">
            {q ? "Nenhuma nota encontrada." : "Nenhuma nota — corre npm run sync."}
          </p>
        )}

        {[...grupos.entries()].map(([pasta, items]) => (
          <div key={pasta} className="mb-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {pasta} · {items.length}
            </h2>
            <ul className="space-y-0.5">
              {items.map((n) => {
                const badge = sourceBadge[n.source as keyof typeof sourceBadge];
                return (
                  <li key={n.path}>
                    <Link
                      href={`/memoria?${new URLSearchParams({ ...(q ? { q } : {}), nota: n.path })}`}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm ${
                        nota === n.path
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <span className="truncate">{n.title}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {notaAberta ? (
          <article>
            <p className="mb-4 font-mono text-xs text-zinc-500">
              {notaAberta.path}
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">
              {notaAberta.content}
            </pre>
          </article>
        ) : (
          <p className="text-sm text-zinc-500">
            Seleciona uma nota à esquerda para a ler.
          </p>
        )}
      </div>
    </div>
  );
}
