import { tool } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { cac, ltv, ltvCacRatio, paybackMeses } from "@/lib/metrics/formulas";

// Meses médios de retenção assumidos enquanto não há histórico de churn real
const RETENCAO_ASSUMIDA_MESES = 12;
const MARGEM_BRUTA_ASSUMIDA = 0.7;

export function dataTools() {
  const supabase = createAdminClient();

  return {
    query_kpis: tool({
      description:
        "Devolve os KPIs atuais do negócio: MRR, clientes ativos, ticket médio, pipeline, funil de conversão, CAC, LTV e receita mensal. Usa SEMPRE que precisares de números do negócio — nunca estimes.",
      inputSchema: z.object({}),
      execute: async () => {
        const [mrr, pipeline, funil, receita, custos] = await Promise.all([
          supabase.from("v_mrr_atual").select("*").single(),
          supabase.from("v_pipeline_resumo").select("*"),
          supabase.from("v_funil_conversao").select("*").single(),
          supabase.from("v_receita_mensal").select("*").order("mes", { ascending: false }).limit(6),
          supabase.from("activities").select("custo").not("custo", "is", null),
        ]);

        const custoAquisicao = (custos.data ?? []).reduce(
          (s, a) => s + Number(a.custo ?? 0),
          0
        );
        const clientes = Number(mrr.data?.clientes_ativos ?? 0);
        const ticket = Number(mrr.data?.ticket_medio ?? 0);
        const cacAtual = cac(custoAquisicao, clientes);
        const ltvAtual = ltv(ticket, MARGEM_BRUTA_ASSUMIDA, RETENCAO_ASSUMIDA_MESES);

        return {
          mrr_eur: Number(mrr.data?.mrr ?? 0),
          clientes_ativos: clientes,
          ticket_medio_eur: ticket,
          pipeline_por_etapa: pipeline.data ?? [],
          funil_conversao: funil.data ?? null,
          receita_ultimos_meses: receita.data ?? [],
          cac_eur: cacAtual,
          ltv_estimado_eur: clientes > 0 ? ltvAtual : null,
          ltv_cac: clientes > 0 ? ltvCacRatio(ltvAtual, cacAtual) : null,
          payback_cac_meses: clientes > 0 ? paybackMeses(cacAtual, ticket) : null,
          nota: "LTV assume margem 70% e retenção 12 meses até haver histórico real de churn.",
        };
      },
    }),

    list_deals: tool({
      description:
        "Lista os deals do pipeline (com lead associado), opcionalmente filtrados por etapa.",
      inputSchema: z.object({
        etapa: z
          .enum(["prospeccao", "contactado", "proposta", "negociacao", "ganho", "perdido"])
          .optional(),
        limit: z.number().int().min(1).max(50).optional().default(20),
      }),
      execute: async ({ etapa, limit }) => {
        let query = supabase
          .from("deals")
          .select(
            "titulo, valor_estimado, valor_fechado, tipo_receita, etapa, probabilidade, data_fecho_prevista, leads(nome, empresa, nicho)"
          )
          .order("updated_at", { ascending: false })
          .limit(limit ?? 20);
        if (etapa) query = query.eq("etapa", etapa);
        const { data, error } = await query;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, deals: data };
      },
    }),

    list_leads: tool({
      description: "Lista leads, opcionalmente filtrados por status ou nicho.",
      inputSchema: z.object({
        status: z
          .enum(["novo", "contactado", "respondeu", "reuniao", "desqualificado", "convertido"])
          .optional(),
        nicho: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional().default(20),
      }),
      execute: async ({ status, nicho, limit }) => {
        let query = supabase
          .from("leads")
          .select("nome, empresa, nicho, localidade, origem, status, instagram")
          .order("updated_at", { ascending: false })
          .limit(limit ?? 20);
        if (status) query = query.eq("status", status);
        if (nicho) query = query.ilike("nicho", `%${nicho}%`);
        const { data, error } = await query;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, leads: data };
      },
    }),

    get_goals_progress: tool({
      description:
        "Devolve as metas ativas com o valor atual (derivado dos dados reais) e a % de progresso.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("v_progresso_metas")
          .select(
            "titulo, tipo_metrica, valor_alvo, valor_atual, progresso_pct, periodo_inicio, periodo_fim"
          )
          .order("periodo_fim");
        if (error) return { erro: error.message };
        if (!data?.length) return { resultado: "Não há metas ativas registadas." };
        return { metas: data };
      },
    }),
  };
}
