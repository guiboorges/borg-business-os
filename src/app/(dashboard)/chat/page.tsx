import Link from "next/link";
import { AGENTS } from "@/lib/agents/registry";

export default function AgentsPage() {
  const agents = Object.values(AGENTS);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Agents</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Each agent is a specialist in its area and knows the business memory.
      </p>

      <div className="mt-6 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <Link
            key={a.id}
            href={`/chat/${a.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-emerald-500/50 hover:bg-zinc-800/50"
          >
            <h2 className="font-semibold text-white">{a.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{a.description}</p>
            <p className="mt-3 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">Use for:</span>{" "}
              {a.whenToUse}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
