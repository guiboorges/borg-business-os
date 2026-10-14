import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Bot, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

const sourceBadge = {
  vault: { label: "Vault", icon: BookOpen, cls: "bg-blue-500/15 text-blue-300" },
  agent: { label: "Agent", icon: Bot, cls: "bg-emerald-500/15 text-emerald-300" },
  knowledge: {
    label: "Knowledge",
    icon: GraduationCap,
    cls: "bg-amber-500/15 text-amber-300",
  },
} as const;

export default async function MemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; note?: string }>;
}) {
  const { q, note } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("agent_memory")
    .select("path, title, source, scope, updated_at")
    .order("path");

  if (q) {
    query = supabase
      .from("agent_memory")
      .select("path, title, source, scope, updated_at")
      .textSearch("fts", q, { type: "websearch", config: "english" })
      .order("path");
  }

  const { data: notes, error } = await query;

  let openNote: { path: string; content: string } | null = null;
  if (note) {
    const { data } = await supabase
      .from("agent_memory")
      .select("path, content")
      .eq("path", note)
      .single();
    openNote = data;
  }

  // Group by top-level folder
  const groups = new Map<string, NonNullable<typeof notes>>();
  for (const n of notes ?? []) {
    const folder = n.path.includes("/") ? n.path.split("/")[0] : "(root)";
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push(n);
  }

  return (
    <div className="flex h-screen">
      <div className="w-96 shrink-0 overflow-y-auto border-r border-zinc-800 p-4">
        <h1 className="mb-3 text-lg font-bold">Memory</h1>

        <form method="GET" className="mb-4">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search notes…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>

        {error && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            No database connection — complete SETUP.md and run the
            migrations + <code>npm run sync</code>.
          </p>
        )}

        {!error && (notes?.length ?? 0) === 0 && (
          <p className="text-sm text-zinc-500">
            {q ? "No notes found." : "No notes yet — run npm run sync."}
          </p>
        )}

        {[...groups.entries()].map(([folder, items]) => (
          <div key={folder} className="mb-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {folder} · {items.length}
            </h2>
            <ul className="space-y-0.5">
              {items.map((n) => {
                const badge = sourceBadge[n.source as keyof typeof sourceBadge];
                return (
                  <li key={n.path}>
                    <Link
                      href={`/memory?${new URLSearchParams({ ...(q ? { q } : {}), note: n.path })}`}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm ${
                        note === n.path
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
        {openNote ? (
          <article>
            <p className="mb-4 font-mono text-xs text-zinc-500">
              {openNote.path}
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">
              {openNote.content}
            </pre>
          </article>
        ) : (
          <p className="text-sm text-zinc-500">
            Select a note on the left to read it.
          </p>
        )}
      </div>
    </div>
  );
}
