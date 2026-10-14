-- KPI views: the SAME source of truth for the dashboard and the agents' tools.
-- View names are kept as a stable API: v_receita_mensal = monthly revenue,
-- v_mrr_atual = current MRR, v_pipeline_resumo = pipeline summary,
-- v_funil_conversao = conversion funnel, v_progresso_metas = goal progress.

-- Revenue per month, splitting recurring (monthly fees) from one-off (setup/extra)
create view v_receita_mensal as
select
  date_trunc('month', data_pagamento)::date as mes,
  sum(valor) filter (where tipo = 'mensalidade') as receita_recorrente,
  sum(valor) filter (where tipo <> 'mensalidade') as receita_pontual,
  sum(valor) as receita_total
from invoices
where status = 'paga' and data_pagamento is not null
group by 1
order by 1;

-- Current MRR = sum of won recurring deals (active contracts)
create view v_mrr_atual as
select
  coalesce(sum(valor_fechado), 0) as mrr,
  count(*) as clientes_ativos,
  coalesce(avg(valor_fechado), 0) as ticket_medio
from deals
where etapa = 'ganho' and tipo_receita = 'recorrente';

-- Pipeline per stage with probability-weighted value
create view v_pipeline_resumo as
select
  etapa,
  count(*) as n_deals,
  coalesce(sum(valor_estimado), 0) as valor_total,
  coalesce(sum(valor_estimado * probabilidade / 100.0), 0) as valor_ponderado
from deals
where etapa not in ('ganho', 'perdido')
group by etapa;

-- Lead conversion funnel (counts per status)
create view v_funil_conversao as
with contagens as (
  select
    count(*) as total,
    count(*) filter (where status <> 'novo') as contactados,
    count(*) filter (where status in ('respondeu', 'reuniao', 'convertido')) as responderam,
    count(*) filter (where status in ('reuniao', 'convertido')) as reunioes,
    count(*) filter (where status = 'convertido') as convertidos
  from leads
)
select
  total, contactados, responderam, reunioes, convertidos,
  round(100.0 * responderam / nullif(contactados, 0), 1) as taxa_resposta_pct,
  round(100.0 * reunioes / nullif(responderam, 0), 1) as taxa_reuniao_pct,
  round(100.0 * convertidos / nullif(reunioes, 0), 1) as taxa_fecho_pct
from contagens;

-- Goal progress: current value derived from the data according to the metric type
create view v_progresso_metas as
select
  g.*,
  case g.tipo_metrica
    when 'mrr' then (select mrr from v_mrr_atual)
    when 'novos_clientes' then (
      select count(*)::numeric from deals d
      where d.etapa = 'ganho'
        and d.data_fecho_real between g.periodo_inicio and g.periodo_fim
    )
    when 'reunioes' then (
      select count(*)::numeric from activities a
      where a.tipo = 'reuniao'
        and a.data between g.periodo_inicio and g.periodo_fim
    )
    when 'receita' then (
      select coalesce(sum(i.valor), 0) from invoices i
      where i.status = 'paga'
        and i.data_pagamento between g.periodo_inicio and g.periodo_fim
    )
    when 'leads' then (
      select count(*)::numeric from leads l
      where l.created_at::date between g.periodo_inicio and g.periodo_fim
    )
    else coalesce(g.valor_atual_manual, 0)
  end as valor_atual,
  round(100.0 * (
    case g.tipo_metrica
      when 'mrr' then (select mrr from v_mrr_atual)
      when 'novos_clientes' then (
        select count(*)::numeric from deals d
        where d.etapa = 'ganho'
          and d.data_fecho_real between g.periodo_inicio and g.periodo_fim
      )
      when 'reunioes' then (
        select count(*)::numeric from activities a
        where a.tipo = 'reuniao'
          and a.data between g.periodo_inicio and g.periodo_fim
      )
      when 'receita' then (
        select coalesce(sum(i.valor), 0) from invoices i
        where i.status = 'paga'
          and i.data_pagamento between g.periodo_inicio and g.periodo_fim
      )
      when 'leads' then (
        select count(*)::numeric from leads l
        where l.created_at::date between g.periodo_inicio and g.periodo_fim
      )
      else coalesce(g.valor_atual_manual, 0)
    end
  ) / nullif(g.valor_alvo, 0), 1) as progresso_pct
from goals g
where g.status = 'ativa';
