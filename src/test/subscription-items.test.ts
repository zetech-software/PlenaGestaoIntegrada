import { describe, expect, it } from "vitest";
import { subscriptionItems } from "@/services/subscription-items";
describe("subscriptionItems", () => {
  it("Multidisciplinar 20 vagas mensal cobra 13 vagas extras", () => {
    expect(subscriptionItems("multidisciplinar", 20, 7, false)).toEqual([
      { priceId: "multidisciplinar_monthly", quantity: 1 },
      { priceId: "vaga_extra_monthly", quantity: 13 },
    ]);
  });
  it("Clínica anual não tem vaga extra", () => {
    expect(subscriptionItems("clinica", 6, 6, true)).toEqual([{ priceId: "clinica_yearly", quantity: 1 }]);
  });
});
