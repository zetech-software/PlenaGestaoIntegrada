import { demoDate } from "@/data/demo-students";
import { MIN_TEXT } from "@/services/record-service";
import type { InterventionPlan, PlanDraft, PlanKind, PlanService, PlanStatus } from "@/types/plan";

export const MAX_GOALS = 8;
/** Retorna mensagem de erro ou null. */
export function validatePlan(draft: PlanDraft) {
  if (!draft.studentId) return "Escolha um aluno.";
  if (draft.title.trim().length < 3) return "Informe um título para o plano.";
  if (!draft.startDate || !draft.reviewDate) return "Informe o início e a data de revisão.";
  if (draft.reviewDate < draft.startDate) return "A revisão não pode ser anterior ao início.";
  if (draft.summary.trim().length < MIN_TEXT)
    return `Descreva o resumo com pelo menos ${MIN_TEXT} caracteres.`;
  const goals = draft.goals;
  if (goals.length === 0) return "Inclua pelo menos uma meta.";
  if (goals.length > MAX_GOALS) return `Use no máximo ${MAX_GOALS} metas.`;
  for (const [index, goal] of goals.entries()) {
    const n = index + 1;
    if (goal.description.trim().length < MIN_TEXT)
      return `Meta ${n}: descreva com pelo menos ${MIN_TEXT} caracteres.`;
    if (!goal.deadline) return `Meta ${n}: informe o prazo.`;
    if (goal.deadline < draft.startDate || goal.deadline > draft.reviewDate)
      return `Meta ${n}: o prazo precisa estar entre o início e a revisão do plano.`;
  }
  return null;
}
/** Média simples do progresso das metas (0 quando não há metas). */
export function planProgress(plan: Pick<InterventionPlan, "goals">) {
  if (plan.goals.length === 0) return 0;
  return Math.round(plan.goals.reduce((sum, g) => sum + g.progress, 0) / plan.goals.length);
}
export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}
/** Plano ativo com data de revisão já vencida na data da demonstração. */
export function isReviewOverdue(plan: InterventionPlan, today = demoDate) {
  return plan.status === "Ativo" && plan.reviewDate < today;
}
export function filterPlans(
  plans: InterventionPlan[],
  kind: PlanKind | "Todos",
  status: PlanStatus | "Todos",
) {
  return plans.filter(
    (p) => (kind === "Todos" || p.kind === kind) && (status === "Todos" || p.status === status),
  );
}
// Troque por um adaptador Supabase/REST que implemente PlanService quando o banco existir.
export class DemoPlanService implements PlanService {
  private plans: InterventionPlan[];
  private seq = 0;
  constructor(seed: InterventionPlan[]) {
    this.plans = seed.map((p) => ({ ...p, goals: p.goals.map((g) => ({ ...g })) }));
  }
  async list() {
    return this.plans.map((p) => ({ ...p, goals: p.goals.map((g) => ({ ...g })) }));
  }
  async create(draft: PlanDraft): Promise<InterventionPlan> {
    const error = validatePlan(draft);
    if (error) throw new Error(error);
    const id = `plano-${++this.seq}`;
    const plan: InterventionPlan = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      id,
      goals: draft.goals.map((g, i) => ({
        description: g.description.trim(),
        strategy: g.strategy.trim(),
        deadline: g.deadline,
        id: `${id}-g${i + 1}`,
        progress: 0,
      })),
    };
    this.plans = [plan, ...this.plans];
    return { ...plan, goals: plan.goals.map((g) => ({ ...g })) };
  }
  async setStatus(id: string, status: PlanStatus) {
    this.plans = this.plans.map((p) => (p.id === id ? { ...p, status } : p));
  }
  async setGoalProgress(planId: string, goalId: string, progress: number) {
    const value = clampProgress(progress);
    this.plans = this.plans.map((p) =>
      p.id === planId
        ? { ...p, goals: p.goals.map((g) => (g.id === goalId ? { ...g, progress: value } : g)) }
        : p,
    );
  }
}
