// Fórmulas de matemática do negócio (metodologia G4).
// ÚNICA fonte de verdade — usada pela UI e pelas tools dos agentes.

/** CAC = investimento total em aquisição ÷ novos clientes no período */
export function cac(custoAquisicaoTotal: number, novosClientes: number): number | null {
  if (novosClientes === 0) return null;
  return custoAquisicaoTotal / novosClientes;
}

/** LTV = ticket médio mensal × margem bruta × meses médios de retenção */
export function ltv(
  ticketMedioMensal: number,
  margemBruta: number,
  mesesRetencao: number
): number {
  return ticketMedioMensal * margemBruta * mesesRetencao;
}

/** LTV:CAC — >5 supercrescimento; 3-5 sustentável; 1-3 crescimento; <1 insustentável (G4) */
export function ltvCacRatio(ltvValor: number, cacValor: number | null): number | null {
  if (!cacValor || cacValor === 0) return null;
  return ltvValor / cacValor;
}

/** Payback do CAC em meses — deve ser ≤ 12 em modelo de recorrência (G4) */
export function paybackMeses(
  cacValor: number | null,
  ticketMedioMensal: number
): number | null {
  if (!cacValor || ticketMedioMensal === 0) return null;
  return cacValor / ticketMedioMensal;
}

/** Churn mensal = clientes perdidos ÷ clientes ativos no início do mês */
export function churnRate(clientesPerdidos: number, clientesInicio: number): number | null {
  if (clientesInicio === 0) return null;
  return clientesPerdidos / clientesInicio;
}

export function formatEUR(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatPct(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${valor.toFixed(1)}%`;
}
