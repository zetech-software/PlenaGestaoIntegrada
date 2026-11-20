export type PaymentMethod = "PIX" | "Dinheiro" | "Cartão" | "Transferência";
export const paymentMethods: PaymentMethod[] = ["PIX", "Dinheiro", "Cartão", "Transferência"];
export type ChargeStatus = "Em aberto" | "Pago" | "Cancelado";
/** "Atrasado" não é gravado: é "Em aberto" com vencimento já passado. */
export type ChargeDisplayStatus = ChargeStatus | "Atrasado";
export interface Charge {
  id: string;
  studentId: string;
  description: string;
  /** Valor em centavos, para não perder precisão com decimais. */
  amountCents: number;
  dueDate: string; // YYYY-MM-DD
  status: ChargeStatus;
  paidOn: string | null;
  method: PaymentMethod | null;
}
export type ChargeDraft = Pick<Charge, "studentId" | "description" | "amountCents" | "dueDate">;
export interface FinanceService {
  list(): Promise<Charge[]>;
  create(draft: ChargeDraft): Promise<Charge>;
  markPaid(id: string, method: PaymentMethod): Promise<void>;
  cancel(id: string): Promise<void>;
}
