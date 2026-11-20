/** Planos de pagamento dos clientes da plataforma e cálculo da validade (puro, testável). */
export interface BillingPlan {
  id: string;
  name: string;
  durationDays: number;
  active: boolean;
}

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
  return fromUtc(toUtc(iso) + days * 86_400_000);
}

/** Nova validade ao contratar/renovar: soma a duração a partir da validade atual, se ainda vigente, ou de hoje. */
export function nextValidUntil(today: string, days: number, current?: string | null) {
  const base = current && current > today ? current : today;
  return addDays(base, days);
}

export function daysLeft(validUntil: string, today: string) {
  return Math.round((toUtc(validUntil) - toUtc(today)) / 86_400_000);
}

export type ValidityState = "sem-plano" | "vigente" | "vencendo" | "vencido";
/** "vencendo" quando faltam 7 dias ou menos. */
export function validityState(validUntil: string | null | undefined, today: string): ValidityState {
  if (!validUntil) return "sem-plano";
  const left = daysLeft(validUntil, today);
  if (left < 0) return "vencido";
  if (left <= 7) return "vencendo";
  return "vigente";
}

export function validatePlan(name: string, days: number, existing: BillingPlan[]) {
  const n = name.trim();
  if (!n) return "Informe o nome do plano.";
  if (n.length > 60) return "Nome do plano muito longo.";
  if (!Number.isInteger(days) || days < 1 || days > 3650) return "A duração deve ficar entre 1 e 3650 dias.";
  if (existing.some((p) => p.name.toLowerCase() === n.toLowerCase())) return "Já existe um plano com este nome.";
  return "";
}

/** Faixa de plano (Consultório, Clínica, Multidisciplinar) com preço e trava de vagas. */
export interface SubscriptionTier {
  id: string;
  code: string;
  name: string;
  audience: string;
  minSeats: number;
  maxSeats: number | null;
  includedSeats: number;
  monthlyCents: number;
  annualMonthlyCents: number;
  extraSeatCents: number;
  extraSeatAnnualCents: number;
  /** Custo mensal estimado por cliente (para margem). */
  costCents?: number;
}

/** Mensagem de erro quando as vagas não cabem na faixa; "" quando estão dentro. */
export function tierSeatsError(tier: SubscriptionTier, seats: number) {
  if (!Number.isInteger(seats) || seats < tier.minSeats || (tier.maxSeats !== null && seats > tier.maxSeats)) {
    const max = tier.maxSeats === null ? "sem limite" : `até ${tier.maxSeats}`;
    return `O plano ${tier.name} aceita a partir de ${tier.minSeats} e ${max} vagas.`;
  }
  return "";
}

/** Valor mensal em centavos; no anual usa o preço mensal do plano anual. Vagas além das incluídas pagam adicional. */
export function tierMonthlyCents(tier: SubscriptionTier, seats: number, annual: boolean) {
  const extra = Math.max(0, seats - tier.includedSeats);
  return annual
    ? tier.annualMonthlyCents + extra * tier.extraSeatAnnualCents
    : tier.monthlyCents + extra * tier.extraSeatCents;
}

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** O ciclo é anual quando dura 1 ano ou mais. */
export const isAnnualCycle = (days: number) => days >= 365;

/** Valor sugerido de uma cobrança: no mensal, o valor do mês; no anual, 12× o valor mensal do plano anual. */
export function cycleChargeCents(tier: SubscriptionTier, seats: number, cycleDays: number) {
  const annual = isAnnualCycle(cycleDays);
  const monthly = tierMonthlyCents(tier, seats, annual);
  return annual ? monthly * 12 : monthly;
}

export function validateTier(t: Omit<SubscriptionTier, "id" | "code">) {
  if (!t.name.trim()) return "Informe o nome do plano.";
  const cents = [t.monthlyCents, t.annualMonthlyCents, t.extraSeatCents, t.extraSeatAnnualCents];
  if (cents.some((c) => !Number.isInteger(c) || c < 0)) return "Valores não podem ser negativos.";
  if (!Number.isInteger(t.minSeats) || t.minSeats < 1) return "O mínimo de vagas deve ser pelo menos 1.";
  if (t.maxSeats !== null && (!Number.isInteger(t.maxSeats) || t.maxSeats < t.minSeats))
    return "O máximo de vagas não pode ser menor que o mínimo.";
  if (t.includedSeats < t.minSeats || (t.maxSeats !== null && t.includedSeats > t.maxSeats))
    return "As vagas incluídas devem ficar entre o mínimo e o máximo.";
  return "";
}

/** Converte "1.234,56" ou "1234.56" em centavos; NaN se inválido. */
export function parseBRL(input: string) {
  const s = input.replace(/[R$\s]/g, "");
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100);
}

export interface TenantPayment {
  id: string;
  tenantId: string;
  amountCents: number;
  paidOn: string;
  method: string;
  planId: string | null;
  tierId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string;
}
export const paymentMethods = ["Pix", "Boleto", "Cartão", "Transferência", "Dinheiro", "Estorno"] as const;
export const paymentsTotal = (list: TenantPayment[]) => list.reduce((s, p) => s + p.amountCents, 0);

/** Receita mensal, custo e margem por plano a partir dos clientes não suspensos. */
export function revenueByTier(
  tiers: SubscriptionTier[],
  tenants: { tierId?: string | null; seats: number; status: string; planDays?: number }[],
) {
  return tiers.map((tier) => {
    const list = tenants.filter((t) => t.tierId === tier.id && t.status !== "Suspenso");
    const revenue = list.reduce((s, t) => s + tierMonthlyCents(tier, t.seats, isAnnualCycle(t.planDays ?? 30)), 0);
    const cost = list.length * (tier.costCents ?? 0);
    const margin = revenue - cost;
    return { tier, clients: list.length, revenue, cost, margin, marginPct: revenue ? Math.round((margin / revenue) * 100) : 0 };
  });
}
