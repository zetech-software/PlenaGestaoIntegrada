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

import { tierMonthlyCents, tierSeatsError, type SubscriptionTier } from "@/services/billing-plans";
const base = { id: "", audience: "", extraSeatCents: 0, extraSeatAnnualCents: 0 };
const consultorio: SubscriptionTier = { ...base, code: "consultorio", name: "Consultório", minSeats: 1, maxSeats: 1, includedSeats: 1, monthlyCents: 11900, annualMonthlyCents: 9900 };
const clinica: SubscriptionTier = { ...base, code: "clinica", name: "Clínica", minSeats: 1, maxSeats: 6, includedSeats: 6, monthlyCents: 34900, annualMonthlyCents: 28900 };
const multi: SubscriptionTier = { ...base, code: "multidisciplinar", name: "Multidisciplinar", minSeats: 7, maxSeats: null, includedSeats: 7, monthlyCents: 49000, annualMonthlyCents: 41650, extraSeatCents: 3500, extraSeatAnnualCents: 2975 };

describe("faixas de plano", () => {
  it("Consultório: R$ 119/mês ou R$ 99 no anual, só 1 profissional", () => {
    expect(tierMonthlyCents(consultorio, 1, false)).toBe(11900);
    expect(tierMonthlyCents(consultorio, 1, true)).toBe(9900);
    expect(tierSeatsError(consultorio, 2)).not.toBe("");
  });
  it("Clínica: R$ 349/mês ou R$ 289 no anual, até 1 admin + 5 terapeutas", () => {
    expect(tierMonthlyCents(clinica, 6, false)).toBe(34900);
    expect(tierMonthlyCents(clinica, 6, true)).toBe(28900);
    expect(tierSeatsError(clinica, 6)).toBe("");
    expect(tierSeatsError(clinica, 7)).not.toBe("");
  });
  it("Multidisciplinar: R$ 490 a partir de 6 terapeutas + R$ 35 por terapeuta adicional", () => {
    expect(tierSeatsError(multi, 6)).not.toBe("");
    expect(tierMonthlyCents(multi, 7, false)).toBe(49000);
    expect(tierMonthlyCents(multi, 9, false)).toBe(49000 + 2 * 3500);
  });
});

import { cycleChargeCents, parseBRL, validateTier } from "@/services/billing-plans";
describe("cobrança e edição de planos", () => {
  it("cobrança mensal da Clínica é R$ 349 e anual é 12 × R$ 289", () => {
    expect(cycleChargeCents(clinica, 6, 30)).toBe(34900);
    expect(cycleChargeCents(clinica, 6, 365)).toBe(28900 * 12);
  });
  it("Multidisciplinar com 9 vagas no mensal cobra R$ 560", () => {
    expect(cycleChargeCents(multi, 9, 30)).toBe(56000);
  });
  it("lê valores em reais", () => {
    expect(parseBRL("1.234,56")).toBe(123456);
    expect(parseBRL("349")).toBe(34900);
    expect(parseBRL("abc")).toBeNaN();
  });
  it("recusa máximo de vagas menor que o mínimo", () => {
    expect(validateTier({ ...clinica, minSeats: 5, maxSeats: 3, includedSeats: 5 })).not.toBe("");
    expect(validateTier(clinica)).toBe("");
  });
});

import { revenueByTier } from "@/services/billing-plans";
describe("revenueByTier", () => {
  it("Multidisciplinar 20 vagas mensal com custo 100 dá margem 845", () => {
    const [r] = revenueByTier([{ ...multi, costCents: 10000 }], [{ tierId: multi.id, seats: 20, status: "Ativo", planDays: 30 }]);
    expect(r?.revenue).toBe(94500);
    expect(r?.margin).toBe(84500);
  });
  it("cliente suspenso não entra na receita", () => {
    const [r] = revenueByTier([multi], [{ tierId: multi.id, seats: 20, status: "Suspenso" }]);
    expect(r?.revenue).toBe(0);
  });
});
