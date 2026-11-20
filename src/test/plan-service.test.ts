import { describe, expect, it } from "vitest";
import {
  DemoPlanService,
  filterPlans,
  isReviewOverdue,
  planProgress,
  validatePlan,
} from "@/services/plan-service";
import { demoPlans } from "@/data/demo-plans";
import type { PlanDraft } from "@/types/plan";

const draft = (patch: Partial<PlanDraft> = {}): PlanDraft => ({
  studentId: "1",
  kind: "PTI",
  status: "Ativo",
  specialty: "Psicologia",
  title: "Plano de teste",
  startDate: "2026-11-01",
  reviewDate: "2026-12-01",
  summary: "Resumo fictício do plano.",
  goals: [{ description: "Descrição fictícia da meta.", strategy: "", deadline: "2026-11-20" }],
  ...patch,
});
describe("plano de intervenção", () => {
  it("valida campos obrigatórios, datas e prazos das metas", () => {
    expect(validatePlan(draft())).toBeNull();
    expect(validatePlan(draft({ studentId: "" }))).toMatch(/aluno/);
    expect(validatePlan(draft({ reviewDate: "2026-10-01" }))).toMatch(/revisão/i);
    expect(validatePlan(draft({ goals: [] }))).toMatch(/meta/);
    expect(
      validatePlan(
        draft({ goals: [{ description: "curta", strategy: "", deadline: "2026-11-20" }] }),
      ),
    ).toMatch(/Meta 1/);
    expect(
      validatePlan(
        draft({
          goals: [
            { description: "Descrição fictícia da meta.", strategy: "", deadline: "2027-01-01" },
          ],
        }),
      ),
    ).toMatch(/prazo/);
  });
  it("cria planos com metas em 0% e sem persistir entre sessões", async () => {
    const service = new DemoPlanService(demoPlans);
    const created = await service.create(draft());
    expect(created.goals.every((g) => g.progress === 0)).toBe(true);
    expect(await service.list()).toHaveLength(demoPlans.length + 1);
    expect(await new DemoPlanService(demoPlans).list()).toHaveLength(demoPlans.length);
    await expect(service.create(draft({ title: "" }))).rejects.toThrow();
  });
  it("atualiza progresso limitado entre 0 e 100 e calcula a média", async () => {
    const service = new DemoPlanService(demoPlans);
    const plan = (await service.list()).find((p) => p.id === "p1");
    if (!plan?.goals[0] || !plan.goals[1]) throw new Error("fixture");
    await service.setGoalProgress(plan.id, plan.goals[0].id, 250);
    await service.setGoalProgress(plan.id, plan.goals[1].id, -5);
    const updated = (await service.list()).find((p) => p.id === "p1");
    expect(updated?.goals.map((g) => g.progress)).toEqual([100, 0]);
    expect(planProgress({ goals: updated?.goals ?? [] })).toBe(50);
    expect(planProgress({ goals: [] })).toBe(0);
  });
  it("filtra por tipo e situação e detecta revisão vencida", () => {
    expect(filterPlans(demoPlans, "PEI", "Todos").every((p) => p.kind === "PEI")).toBe(true);
    expect(filterPlans(demoPlans, "Todos", "Concluído")).toHaveLength(1);
    const plan = demoPlans[0];
    if (!plan) throw new Error("fixture");
    expect(isReviewOverdue(plan, "2027-01-01")).toBe(true);
    expect(isReviewOverdue(plan, "2026-11-20")).toBe(false);
  });
});
