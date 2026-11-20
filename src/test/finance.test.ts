import { describe, expect, it } from "vitest";
import {
  DemoFinanceService,
  displayStatus,
  filterCharges,
  formatBRL,
  parseBRL,
  summarize,
  validateCharge,
} from "@/services/finance-service";
import { financeReport } from "@/services/report-service";
import { canAccess } from "@/services/permissions";
import { demoStudents } from "@/data/demo-students";
import { demoCharges } from "@/data/demo-charges";

const november = { from: "2026-11-01", to: "2026-11-30" };
const draft = {
  studentId: "1",
  description: "Mensalidade",
  amountCents: 15000,
  dueDate: "2026-12-10",
};
describe("valores em reais", () => {
  it("converte entradas comuns para centavos", () => {
    expect(parseBRL("150")).toBe(15000);
    expect(parseBRL("150,00")).toBe(15000);
    expect(parseBRL("1.250,50")).toBe(125050);
    expect(parseBRL("R$ 150,5")).toBe(15050);
    expect(parseBRL("150.00")).toBe(15000);
    expect(parseBRL("1.500")).toBe(150000);
  });
  it("recusa vazio, zero, negativo e valor absurdo", () => {
    for (const bad of ["", "abc", "0", "0,00", "-10", "9.999.999,00"]) {
      expect(parseBRL(bad)).toBeNull();
    }
  });
  it("formata em reais", () => {
    expect(formatBRL(125050).replace(/\s/g, " ")).toBe("R$ 1.250,50");
  });
});
describe("cobranças", () => {
  it("valida aluno, descrição, valor e vencimento", () => {
    expect(validateCharge(draft)).toBeNull();
    expect(validateCharge({ ...draft, studentId: "" })).toMatch(/aluno/);
    expect(validateCharge({ ...draft, description: "x" })).toMatch(/Descreva/);
    expect(validateCharge({ ...draft, amountCents: 0 })).toMatch(/valor/);
    expect(validateCharge({ ...draft, amountCents: 1.5 })).toMatch(/valor/);
    expect(validateCharge({ ...draft, dueDate: "" })).toMatch(/vencimento/);
  });
  it("em aberto vencida aparece como atrasada, sem mudar o que está gravado", () => {
    const f3 = demoCharges.find((c) => c.id === "f3");
    if (!f3) throw new Error("fixture");
    expect(f3.status).toBe("Em aberto");
    expect(displayStatus(f3, "2026-11-20")).toBe("Atrasado");
    expect(displayStatus(f3, "2026-11-15")).toBe("Em aberto");
    expect(displayStatus({ ...f3, status: "Pago" }, "2026-11-20")).toBe("Pago");
  });
  it("resume a receber, atraso e recebido no período", () => {
    // f2 (10/11) e f3 (15/11) vencidas = 48000 + 42000; f4 (25/11) no prazo; f1 e f5 pagas em novembro
    expect(summarize(demoCharges, november, "2026-11-20")).toEqual({
      toReceive: 48000,
      overdue: 90000,
      received: 138000,
    });
    expect(summarize(demoCharges, { from: "2026-12-01", to: "2026-12-31" }).received).toBe(0);
  });
  it("filtra por situação exibida e ordena por vencimento", () => {
    expect(filterCharges(demoCharges, "Atrasado", "2026-11-20").map((c) => c.id)).toEqual([
      "f2",
      "f3",
    ]);
    expect(filterCharges(demoCharges, "Todas", "2026-11-20")[0]?.id).toBe("f6");
  });
  it("cria, baixa e cancela só o que está em aberto, sem persistir", async () => {
    const service = new DemoFinanceService(demoCharges);
    const created = await service.create(draft);
    expect(created).toMatchObject({ status: "Em aberto", paidOn: null, method: null });
    await service.markPaid(created.id, "PIX");
    const paid = (await service.list()).find((c) => c.id === created.id);
    expect(paid).toMatchObject({ status: "Pago", method: "PIX" });
    await expect(service.markPaid(created.id, "PIX")).rejects.toThrow(/em aberto/);
    await expect(service.cancel(created.id)).rejects.toThrow(/em aberto/);
    await expect(service.cancel("f2")).resolves.toBeUndefined();
    await expect(service.markPaid("f2", "PIX")).rejects.toThrow();
    await expect(service.markPaid("nao-existe", "PIX")).rejects.toThrow(/não encontrada/);
    await expect(service.create({ ...draft, amountCents: 0 })).rejects.toThrow();
    expect(await new DemoFinanceService(demoCharges).list()).toHaveLength(demoCharges.length);
  });
  it("só admin e clínica acessam o financeiro", () => {
    expect(canAccess("admin", "financeiro")).toBe(true);
    expect(canAccess("clinica", "financeiro")).toBe(true);
    expect(canAccess("terapeuta", "financeiro")).toBe(false);
    expect(canAccess(null, "financeiro")).toBe(false);
  });
  it("relatório financeiro lista o período e soma por situação, sem cancelados", () => {
    const report = financeReport(demoCharges, demoStudents, november);
    expect(report.rows.map((r) => r.charge.id)).toEqual(["f5", "f1", "f2", "f3", "f4"]);
    expect(report.rows.find((r) => r.charge.id === "f3")?.studentName).toBe("Gabriel Ribeiro");
    expect(report.totals).toEqual({ open: 48000, overdue: 90000, paid: 138000 });
    expect(financeReport(demoCharges, demoStudents, { from: "2027-01-01", to: "" }).rows).toEqual(
      [],
    );
  });
});
