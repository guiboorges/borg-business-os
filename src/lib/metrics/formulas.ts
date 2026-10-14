// Business maths formulas (G4 methodology).
// The SINGLE source of truth — used by the UI and by the agents' tools.

/** CAC = total acquisition spend ÷ new customers in the period */
export function cac(totalAcquisitionCost: number, newCustomers: number): number | null {
  if (newCustomers === 0) return null;
  return totalAcquisitionCost / newCustomers;
}

/** LTV = average monthly ticket × gross margin × average retention months */
export function ltv(
  avgMonthlyTicket: number,
  grossMargin: number,
  retentionMonths: number
): number {
  return avgMonthlyTicket * grossMargin * retentionMonths;
}

/** LTV:CAC — >5 hypergrowth; 3-5 sustainable; 1-3 growth; <1 unsustainable (G4) */
export function ltvCacRatio(ltvValue: number, cacValue: number | null): number | null {
  if (!cacValue || cacValue === 0) return null;
  return ltvValue / cacValue;
}

/** CAC payback in months — should be ≤ 12 in a recurring-revenue model (G4) */
export function paybackMonths(
  cacValue: number | null,
  avgMonthlyTicket: number
): number | null {
  if (!cacValue || avgMonthlyTicket === 0) return null;
  return cacValue / avgMonthlyTicket;
}

/** Monthly churn = customers lost ÷ active customers at the start of the month */
export function churnRate(customersLost: number, customersAtStart: number): number | null {
  if (customersAtStart === 0) return null;
  return customersLost / customersAtStart;
}

export function formatEUR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}
