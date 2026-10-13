import { createClient } from "@/lib/supabase/server";
import { NEGOCIO } from "@/config/negocio";
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

export default async function VisaoGeralPage() {
  const supabase = await createClient();

  const semanaAtras = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

  const inicioMes = new Date();
  inicioMes.setDate(1);

  const [mrr, pipeline, funil, receita, atividadeSemana, reunioesSemana, custos, tokensMes] =
    await Promise.all([
      supabase.from("v_mrr_atual").select("*").single(),
      supabase.from("v_pipeline_resumo").select("*"),
      supabase.from("v_funil_conversao").select("*").single(),
      supabase.from("v_receita_mensal").select("*").order("mes").limit(12),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .in("tipo", ["dm", "email", "chamada", "followup"])
        .gte("data", semanaAtras),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "reuniao")
        .gte("data", semanaAtras),
      supabase.from("activities").select("custo").not("custo", "is", null),
      supabase
        .from("messages")
        .select("tokens_in, tokens_out")
        .gte("created_at", inicioMes.toISOString())
        .not("tokens_in", "is", null),
    ]);

  const dbOffline = mrr.error && funil.error;

  const mrrValor = Number(mrr.data?.mrr ?? 0);
  const clientes = Number(mrr.data?.clientes_ativos ?? 0);
  const pipelineTotal = (pipeline.data ?? []).reduce(
    (s, p) => s + Number(p.valor_ponderado ?? 0),
    0
  );
  const custoTotal = (custos.data ?? []).reduce((s, a) => s + Number(a.custo ?? 0), 0);
  const cacAtual = cac(custoTotal, clientes);

  // Custo estimado da IA no mês (preço de tabela do Sonnet: $3/M in, $15/M out —
  // aproximação; o Estrategista usa Opus e o cache reduz o custo real de input)
  const custoIaUsd = (tokensMes.data ?? []).reduce(
    (s, m) =>
      s + (Number(m.tokens_in ?? 0) * 3 + Number(m.tokens_out ?? 0) * 15) / 1_000_000,
    0
  );

  const chartData = (receita.data ?? []).map((r) => ({
    mes: new Date(r.mes).toLocaleDateString("pt-PT", { month: "short" }),
    recorrente: Number(r.receita_recorrente ?? 0),
    pontual: Number(r.receita_pontual ?? 0),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Visão Geral</h1>

      {dbOffline && (
        <p className="mt-4 max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Sem ligação à base de dados — completa o SETUP.md e aplica as
          migrations para veres os KPIs.
        </p>
      )}

      {/* Matemática do negócio */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={formatEUR(mrrValor)}
          hint={`meta: ${NEGOCIO.metaCurta}`}
        />
        <KpiCard label="Clientes ativos" value={String(clientes)} hint="meta: 10" />
        <KpiCard
          label="Pipeline ponderado"
          value={formatEUR(pipelineTotal)}
          hint="valor × probabilidade"
        />
        <KpiCard
          label="CAC"
          value={formatEUR(cacAtual)}
          hint={clientes === 0 ? "sem clientes ainda" : "custo por cliente ganho"}
        />
      </div>

      {/* Métricas de prospecção — os KPIs reais da fase atual */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Prospecção (últimos 7 dias)
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Contactos feitos"
          value={String(atividadeSemana.count ?? 0)}
          hint="DMs, emails, chamadas, follow-ups"
        />
        <KpiCard
          label="Reuniões"
          value={String(reunioesSemana.count ?? 0)}
          hint="realizadas/marcadas esta semana"
        />
        <KpiCard
          label="Taxa de resposta"
          value={formatPct(funil.data?.taxa_resposta_pct ?? null)}
          hint="responderam ÷ contactados"
        />
        <KpiCard
          label="Taxa de fecho"
          value={formatPct(funil.data?.taxa_fecho_pct ?? null)}
          hint="convertidos ÷ reuniões"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Custo IA (mês)"
          value={`$${custoIaUsd.toFixed(2)}`}
          hint="estimativa por tokens dos agentes"
        />
      </div>

      {/* Receita */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Receita mensal
      </h2>
      <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {chartData.length > 0 ? (
          <RevenueChart data={chartData} />
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">
            Sem receita registada ainda — quando fechares o próximo cliente,
            regista a invoice no pipeline e ela aparece aqui.
          </p>
        )}
      </div>
    </div>
  );
}
