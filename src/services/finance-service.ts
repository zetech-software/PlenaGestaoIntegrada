import { demoDate } from "@/data/demo-students";
import type {
  Charge,
  ChargeDisplayStatus,
  ChargeDraft,
  FinanceService,
  PaymentMethod,
} from "@/types/finance";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}
/** "150", "150,00", "1.250,50" ou "R$ 150,00" → centavos; null se inválido ou não positivo. */
export function parseBRL(input: string) {
  if (input.includes("-")) return null;
  const text = input.replace(/[^\d.,]/g, "");
  if (!text) return null;
  let normalized: string;
  if (text.includes(",")) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (/\.\d{1,2}$/.test(text))
    normalized = text.replace(/\.(?=.*\.)/g, ""); // 150.5 ou 150.00
  else normalized = text.replace(/\./g, ""); // 1.500 → 1500
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  const cents = Math.round(value * 100);
  return cents > MAX_CENTS ? null : cents;
}
export const MAX_CENTS = 100_000_00;
/** Retorna mensagem de erro ou null. */
export function validateCharge(draft: ChargeDraft) {
  if (!draft.studentId) return "Escolha um aluno.";
  if (draft.description.trim().length < 3) return "Descreva a cobrança.";
  if (!Number.isInteger(draft.amountCents) || draft.amountCents <= 0)
    return "Informe um valor maior que zero.";
  if (draft.amountCents > MAX_CENTS) return "Valor acima do limite permitido.";
  if (!draft.dueDate) return "Informe o vencimento.";
  return null;
}
export function displayStatus(charge: Charge, today = demoDate): ChargeDisplayStatus {
  return charge.status === "Em aberto" && charge.dueDate < today ? "Atrasado" : charge.status;
}
export function filterCharges(
  charges: Charge[],
  status: ChargeDisplayStatus | "Todas",
  today = demoDate,
) {
  return charges
    .filter((c) => status === "Todas" || displayStatus(c, today) === status)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}
export interface FinanceSummary {
  /** Em aberto e ainda no prazo. */
  toReceive: number;
  /** Em aberto com vencimento passado. */
  overdue: number;
  /** Pago dentro do período. */
  received: number;
}
export function summarize(
  charges: Charge[],
  period: { from: string; to: string },
  today = demoDate,
): FinanceSummary {
  const sum = (list: Charge[]) => list.reduce((total, c) => total + c.amountCents, 0);
  return {
    toReceive: sum(charges.filter((c) => displayStatus(c, today) === "Em aberto")),
    overdue: sum(charges.filter((c) => displayStatus(c, today) === "Atrasado")),
    received: sum(
      charges.filter(
        (c) =>
          c.status === "Pago" &&
          c.paidOn !== null &&
          (!period.from || c.paidOn >= period.from) &&
          (!period.to || c.paidOn <= period.to),
      ),
    ),
  };
}
// Troque por um adaptador Supabase que implemente FinanceService quando o banco existir.
// Este módulo não processa pagamentos: só registra cobranças e baixas feitas por fora.
export class DemoFinanceService implements FinanceService {
  private items: Charge[];
  private seq = 0;
  constructor(seed: Charge[]) {
    this.items = seed.map((c) => ({ ...c }));
  }
  async list() {
    return this.items.map((c) => ({ ...c }));
  }
  async create(draft: ChargeDraft) {
    const error = validateCharge(draft);
    if (error) throw new Error(error);
    const charge: Charge = {
      ...draft,
      description: draft.description.trim(),
      id: `cobranca-${++this.seq}`,
      status: "Em aberto",
      paidOn: null,
      method: null,
    };
    this.items = [...this.items, charge];
    return { ...charge };
  }
  /** Só cobrança em aberto pode ser baixada; pagamento registrado não é desfeito aqui. */
  async markPaid(id: string, method: PaymentMethod) {
    const target = this.items.find((c) => c.id === id);
    if (!target) throw new Error("Cobrança não encontrada.");
    if (target.status !== "Em aberto")
      throw new Error("Só cobranças em aberto podem ser baixadas.");
    this.items = this.items.map((c) =>
      c.id === id ? { ...c, status: "Pago", paidOn: demoDate, method } : c,
    );
  }
  async cancel(id: string) {
    const target = this.items.find((c) => c.id === id);
    if (!target) throw new Error("Cobrança não encontrada.");
    if (target.status !== "Em aberto")
      throw new Error("Só cobranças em aberto podem ser canceladas.");
    this.items = this.items.map((c) => (c.id === id ? { ...c, status: "Cancelado" } : c));
  }
}
