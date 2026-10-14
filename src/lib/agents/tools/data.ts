import { tool } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { cac, ltv, ltvCacRatio, paybackMonths } from "@/lib/metrics/formulas";

// Average retention months assumed until there is real churn history
const ASSUMED_RETENTION_MONTHS = 12;
const ASSUMED_GROSS_MARGIN = 0.7;

// Note: the database schema (tables, columns, enum values) uses Portuguese
// identifiers — e.g. deal stage "ganho" = won. They are stored values, so the
// tools keep them as-is and the descriptions explain them to the model.

export function dataTools() {
  const supabase = createAdminClient();

  return {
    query_kpis: tool({
      description:
        "Returns the business's current KPIs: MRR, active customers, average ticket, pipeline, conversion funnel, CAC, LTV and monthly revenue. ALWAYS use it when you need business numbers — never estimate.",
      inputSchema: z.object({}),
      execute: async () => {
        const [mrr, pipeline, funnel, revenue, costs] = await Promise.all([
          supabase.from("v_mrr_atual").select("*").single(),
          supabase.from("v_pipeline_resumo").select("*"),
          supabase.from("v_funil_conversao").select("*").single(),
          supabase.from("v_receita_mensal").select("*").order("mes", { ascending: false }).limit(6),
          supabase.from("activities").select("custo").not("custo", "is", null),
        ]);

        const acquisitionCost = (costs.data ?? []).reduce(
          (s, a) => s + Number(a.custo ?? 0),
          0
        );
        const customers = Number(mrr.data?.clientes_ativos ?? 0);
        const ticket = Number(mrr.data?.ticket_medio ?? 0);
        const currentCac = cac(acquisitionCost, customers);
        const currentLtv = ltv(ticket, ASSUMED_GROSS_MARGIN, ASSUMED_RETENTION_MONTHS);

        return {
          mrr_eur: Number(mrr.data?.mrr ?? 0),
          active_customers: customers,
          avg_ticket_eur: ticket,
          // rows: etapa (stage), n_deals, valor_total (total value), valor_ponderado (probability-weighted value)
          pipeline_by_stage: pipeline.data ?? [],
          // counts per lead status + taxa_resposta_pct (reply rate), taxa_reuniao_pct (meeting rate), taxa_fecho_pct (close rate)
          conversion_funnel: funnel.data ?? null,
          // rows: mes (month), receita_recorrente (recurring), receita_pontual (one-off), receita_total (total)
          revenue_last_months: revenue.data ?? [],
          cac_eur: currentCac,
          estimated_ltv_eur: customers > 0 ? currentLtv : null,
          ltv_cac: customers > 0 ? ltvCacRatio(currentLtv, currentCac) : null,
          cac_payback_months: customers > 0 ? paybackMonths(currentCac, ticket) : null,
          note: "LTV assumes a 70% margin and 12-month retention until there is real churn history. Column names in the rows are the database's (Portuguese) names.",
        };
      },
    }),

    list_deals: tool({
      description:
        "Lists pipeline deals (with their associated lead), optionally filtered by stage. Stage values: prospeccao (prospecting), contactado (contacted), proposta (proposal), negociacao (negotiation), ganho (won), perdido (lost).",
      inputSchema: z.object({
        stage: z
          .enum(["prospeccao", "contactado", "proposta", "negociacao", "ganho", "perdido"])
          .optional()
          .describe("Deal stage (stored value)"),
        limit: z.number().int().min(1).max(50).optional().default(20),
      }),
      execute: async ({ stage, limit }) => {
        let query = supabase
          .from("deals")
          .select(
            "titulo, valor_estimado, valor_fechado, tipo_receita, etapa, probabilidade, data_fecho_prevista, leads(nome, empresa, nicho)"
          )
          .order("updated_at", { ascending: false })
          .limit(limit ?? 20);
        if (stage) query = query.eq("etapa", stage);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { total: data?.length ?? 0, deals: data };
      },
    }),

    list_leads: tool({
      description:
        "Lists leads, optionally filtered by status or niche. Status values: novo (new), contactado (contacted), respondeu (replied), reuniao (meeting), desqualificado (disqualified), convertido (converted).",
      inputSchema: z.object({
        status: z
          .enum(["novo", "contactado", "respondeu", "reuniao", "desqualificado", "convertido"])
          .optional()
          .describe("Lead status (stored value)"),
        niche: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional().default(20),
      }),
      execute: async ({ status, niche, limit }) => {
        let query = supabase
          .from("leads")
          .select("nome, empresa, nicho, localidade, origem, status, instagram")
          .order("updated_at", { ascending: false })
          .limit(limit ?? 20);
        if (status) query = query.eq("status", status);
        if (niche) query = query.ilike("nicho", `%${niche}%`);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { total: data?.length ?? 0, leads: data };
      },
    }),

    get_goals_progress: tool({
      description:
        "Returns the active goals with their current value (derived from real data) and % progress.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("v_progresso_metas")
          .select(
            "titulo, tipo_metrica, valor_alvo, valor_atual, progresso_pct, periodo_inicio, periodo_fim"
          )
          .order("periodo_fim");
        if (error) return { error: error.message };
        if (!data?.length) return { result: "There are no active goals recorded." };
        return { goals: data };
      },
    }),
  };
}
