import { createStableContext } from "@/lib/stable-context";
import { useContext, useState, type ReactNode } from "react";
import { DemoPlanService } from "@/services/plan-service";
import { demoPlans } from "@/data/demo-plans";
import { useStudents } from "@/hooks/use-students";
import type { InterventionPlan, PlanDraft, PlanStatus } from "@/types/plan";
interface Ctx {
  plans: InterventionPlan[];
  addPlan: (draft: PlanDraft) => InterventionPlan;
  setStatus: (id: string, status: PlanStatus) => void;
  setGoalProgress: (planId: string, goalId: string, progress: number) => void;
}
const PlanContext = createStableContext<Ctx>("PlanContext");
export function PlansProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new DemoPlanService(demoPlans));
  const [plans, setPlans] = useState(() => service.list());
  const { students } = useStudents();
  const visibleIds = new Set(students.map((x) => x.id));
  const value: Ctx = {
    plans: plans.filter((p) => visibleIds.has(p.studentId)),
    addPlan(draft) {
      const created = service.create(draft);
      setPlans(service.list());
      return created;
    },
    setStatus(id, status) {
      service.setStatus(id, status);
      setPlans(service.list());
    },
    setGoalProgress(planId, goalId, progress) {
      service.setGoalProgress(planId, goalId, progress);
      setPlans(service.list());
    },
  };
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
export function usePlans() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("PlansProvider is required");
  return ctx;
}
