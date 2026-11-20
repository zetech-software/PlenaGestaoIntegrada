import { describe, expect, it } from "vitest";
import { addDays, nextValidUntil, validatePlan, validityState } from "@/services/billing-plans";

describe("planos de pagamento", () => {
  it("plano mensal vale 30 dias", () => {
    expect(nextValidUntil("2026-11-20", 30)).toBe("2026-12-20");
  });
  it("plano anual vale 365 dias", () => {
    expect(nextValidUntil("2026-11-20", 365)).toBe("2027-11-20");
  });
  it("renovação antes do vencimento soma a partir da validade atual", () => {
    expect(nextValidUntil("2026-11-20", 30, "2026-11-25")).toBe("2026-12-25");
  });
  it("renovação de plano vencido conta a partir de hoje", () => {
    expect(nextValidUntil("2026-11-20", 30, "2026-10-01")).toBe("2026-12-20");
  });
  it("estado da validade", () => {
    expect(validityState(null, "2026-11-20")).toBe("sem-plano");
    expect(validityState("2026-11-19", "2026-11-20")).toBe("vencido");
    expect(validityState("2026-11-27", "2026-11-20")).toBe("vencendo");
    expect(validityState("2026-11-28", "2026-11-20")).toBe("vigente");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("duração precisa ficar entre 1 e 3650 dias", () => {
    expect(validatePlan("X", 0, [])).not.toBe("");
    expect(validatePlan("Plano Mensal", 30, [{ id: "1", name: "plano mensal", durationDays: 30, active: true }])).not.toBe("");
    expect(validatePlan("Trimestral", 90, [])).toBe("");
  });
});
