import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoPlanService, clampProgress } from "@/services/plan-service";
import { demoPlans } from "@/data/demo-plans";
import { useStudents } from "@/hooks/use-students";
import type { InterventionPlan, PlanDraft, PlanService, PlanStatus } from "@/types/plan";
interface Ctx {
  plans: InterventionPlan[];
  isLoading: boolean;
  error: Error | null;
  addPlan: (draft: PlanDraft) => Promise<InterventionPlan>;
  setStatus: (id: string, status: PlanStatus) => Promise<void>;
  setGoalProgress: (planId: string, goalId: string, progress: number) => Promise<void>;
}
const PlanContext = createContext<Ctx | null>(null);
const plansKey = ["plans"] as const;
export function PlansProvider({ children }: { children: ReactNode }) {
  const [service] = useState<PlanService>(() => new DemoPlanService(demoPlans));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: plansKey, queryFn: () => service.list() });
  const { students, isLoading: studentsLoading } = useStudents();
  const create = useMutation({
    mutationFn: (draft: PlanDraft) => service.create(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: plansKey }),
  });
  // Troca de situação e arrastar o controle de progresso atualizam a tela na hora;
  // se a gravação falhar, a tela volta ao valor anterior.
  const optimistic = {
    onMutate: async (update: (plans: InterventionPlan[]) => InterventionPlan[]) => {
      await queryClient.cancelQueries({ queryKey: plansKey });
      const previous = queryClient.getQueryData<InterventionPlan[]>(plansKey);
      queryClient.setQueryData<InterventionPlan[]>(plansKey, (current) =>
        current ? update(current) : current,
      );
      return { previous };
    },
    onError: (
      _e: unknown,
      _v: unknown,
      context?: { previous?: InterventionPlan[] | undefined },
    ) => {
      if (context?.previous) queryClient.setQueryData(plansKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: plansKey }),
  };
  const changeStatus = useMutation({
    mutationFn: (vars: { id: string; status: PlanStatus }) =>
      service.setStatus(vars.id, vars.status),
    onMutate: ({ id, status }) =>
      optimistic.onMutate((plans) => plans.map((p) => (p.id === id ? { ...p, status } : p))),
    onError: optimistic.onError,
    onSettled: optimistic.onSettled,
  });
  const changeProgress = useMutation({
    mutationFn: (vars: { planId: string; goalId: string; progress: number }) =>
      service.setGoalProgress(vars.planId, vars.goalId, vars.progress),
    onMutate: ({ planId, goalId, progress }) =>
      optimistic.onMutate((plans) =>
        plans.map((p) =>
          p.id === planId
            ? {
                ...p,
                goals: p.goals.map((g) =>
                  g.id === goalId ? { ...g, progress: clampProgress(progress) } : g,
                ),
              }
            : p,
        ),
      ),
    onError: optimistic.onError,
    onSettled: optimistic.onSettled,
  });
  const visibleIds = new Set(students.map((x) => x.id));
  const value: Ctx = {
    plans: (query.data ?? []).filter((p) => visibleIds.has(p.studentId)),
    isLoading: query.isPending || studentsLoading,
    error: query.error,
    addPlan: (draft) => create.mutateAsync(draft),
    setStatus: (id, status) => changeStatus.mutateAsync({ id, status }),
    setGoalProgress: (planId, goalId, progress) =>
      changeProgress.mutateAsync({ planId, goalId, progress }),
  };
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
export function usePlans() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("PlansProvider is required");
  return ctx;
}
