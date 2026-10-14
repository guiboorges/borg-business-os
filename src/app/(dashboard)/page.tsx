import { createClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/config/business";
import { RevenueChart } from "@/components/revenue-chart";
import { cac, formatEUR, formatPct } from "@/lib/metrics/formulas";

export const dynamic = "force-dynamic";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

  const monthStart = new Date();
  monthStart.setDate(1);

  const [mrr, pipeline, funnel, revenue, weekActivity, weekMeetings, costs, monthTokens] =
    await Promise.all([
      supabase.from("v_mrr_atual").select("*").single(),
      supabase.from("v_pipeline_resumo").select("*"),
      supabase.from("v_funil_conversao").select("*").single(),
      supabase.from("v_receita_mensal").select("*").order("mes").limit(12),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .in("tipo", ["dm", "email", "chamada", "followup"])
        .gte("data", weekAgo),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "reuniao")
        .gte("data", weekAgo),
      supabase.from("activities").select("custo").not("custo", "is", null),
      supabase
        .from("messages")
        .select("tokens_in, tokens_out")
        .gte("created_at", monthStart.toISOString())
        .not("tokens_in", "is", null),
    ]);

  const dbOffline = mrr.error && funnel.error;

  const mrrValue = Number(mrr.data?.mrr ?? 0);
  const customers = Number(mrr.data?.clientes_ativos ?? 0);
  const pipelineTotal = (pipeline.data ?? []).reduce(
    (s, p) => s + Number(p.valor_ponderado ?? 0),
    0
  );
  const totalCost = (costs.data ?? []).reduce((s, a) => s + Number(a.custo ?? 0), 0);
  const currentCac = cac(totalCost, customers);

  // Estimated AI cost for the month (Sonnet list price: $3/M in, $15/M out —
  // an approximation; the Strategist uses Opus and caching lowers the real input cost)
  const aiCostUsd = (monthTokens.data ?? []).reduce(
    (s, m) =>
      s + (Number(m.tokens_in ?? 0) * 3 + Number(m.tokens_out ?? 0) * 15) / 1_000_000,
    0
  );

  const chartData = (revenue.data ?? []).map((r) => ({
    month: new Date(r.mes).toLocaleDateString("en-GB", { month: "short" }),
    recurring: Number(r.receita_recorrente ?? 0),
    oneOff: Number(r.receita_pontual ?? 0),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      {dbOffline && (
        <p className="mt-4 max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No database connection — complete SETUP.md and apply the
          migrations to see your KPIs.
        </p>
      )}

      {/* Business maths */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={formatEUR(mrrValue)}
          hint={`goal: ${BUSINESS.shortGoal}`}
        />
        <KpiCard label="Active customers" value={String(customers)} hint="goal: 10" />
        <KpiCard
          label="Weighted pipeline"
          value={formatEUR(pipelineTotal)}
          hint="value × probability"
        />
        <KpiCard
          label="CAC"
          value={formatEUR(currentCac)}
          hint={customers === 0 ? "no customers yet" : "cost per customer won"}
        />
      </div>

      {/* Prospecting metrics — the real KPIs at the current stage */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Prospecting (last 7 days)
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Contacts made"
          value={String(weekActivity.count ?? 0)}
          hint="DMs, emails, calls, follow-ups"
        />
        <KpiCard
          label="Meetings"
          value={String(weekMeetings.count ?? 0)}
          hint="held/booked this week"
        />
        <KpiCard
          label="Reply rate"
          value={formatPct(funnel.data?.taxa_resposta_pct ?? null)}
          hint="replied ÷ contacted"
        />
        <KpiCard
          label="Close rate"
          value={formatPct(funnel.data?.taxa_fecho_pct ?? null)}
          hint="converted ÷ meetings"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="AI cost (month)"
          value={`$${aiCostUsd.toFixed(2)}`}
          hint="estimate from agent tokens"
        />
      </div>

      {/* Revenue */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Monthly revenue
      </h2>
      <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {chartData.length > 0 ? (
          <RevenueChart data={chartData} />
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">
            No revenue recorded yet — when you close your next customer,
            record the invoice in the pipeline and it will show up here.
          </p>
        )}
      </div>
    </div>
  );
}
