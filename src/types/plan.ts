import type { Specialty } from "@/types/record";

/** PEI = Plano Educacional Individualizado; PTI = Plano Terapêutico Individualizado. */
export type PlanKind = "PEI" | "PTI";
export const planKinds: PlanKind[] = ["PEI", "PTI"];
export const planKindLabels: Record<PlanKind, string> = {
  PEI: "Plano Educacional Individualizado",
  PTI: "Plano Terapêutico Individualizado",
};
export type PlanStatus = "Rascunho" | "Ativo" | "Concluído";
export const planStatuses: PlanStatus[] = ["Rascunho", "Ativo", "Concluído"];

export interface PlanGoal {
  id: string;
  description: string;
  strategy: string;
  deadline: string; // YYYY-MM-DD
  progress: number; // 0–100
}
export interface InterventionPlan {
  id: string;
  studentId: string;
  kind: PlanKind;
  title: string;
  specialty: Specialty;
  startDate: string;
  reviewDate: string;
  status: PlanStatus;
  summary: string;
  goals: PlanGoal[];
}
export type GoalDraft = Pick<PlanGoal, "description" | "strategy" | "deadline">;
export type PlanDraft = Omit<InterventionPlan, "id" | "status" | "goals"> & {
  status: PlanStatus;
  goals: GoalDraft[];
};
export interface PlanService {
  list(): Promise<InterventionPlan[]>;
  create(draft: PlanDraft): Promise<InterventionPlan>;
  setStatus(id: string, status: PlanStatus): Promise<void>;
  setGoalProgress(planId: string, goalId: string, progress: number): Promise<void>;
}
