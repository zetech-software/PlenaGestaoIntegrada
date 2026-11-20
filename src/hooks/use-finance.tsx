import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoFinanceService } from "@/services/finance-service";
import { demoCharges } from "@/data/demo-charges";
import { useAuth } from "@/hooks/use-auth";
import { useStudents } from "@/hooks/use-students";
import { canAccess } from "@/services/permissions";
import type { Charge, ChargeDraft, FinanceService, PaymentMethod } from "@/types/finance";
interface Ctx {
  charges: Charge[];
  isLoading: boolean;
  error: Error | null;
  create: (draft: ChargeDraft) => Promise<Charge>;
  markPaid: (id: string, method: PaymentMethod) => Promise<void>;
  cancel: (id: string) => Promise<void>;
}
const FinanceContext = createContext<Ctx | null>(null);
const financeKey = ["charges"] as const;
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [service] = useState<FinanceService>(() => new DemoFinanceService(demoCharges));
  const queryClient = useQueryClient();
  const { role } = useAuth();
  // Terapeuta não vê financeiro: nem a consulta é feita.
  const allowed = canAccess(role, "financeiro");
  const query = useQuery({ queryKey: financeKey, queryFn: () => service.list(), enabled: allowed });
  const { students, isLoading: studentsLoading } = useStudents();
  const refresh = { onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKey }) };
  const create = useMutation({ mutationFn: (d: ChargeDraft) => service.create(d), ...refresh });
  const markPaid = useMutation({
    mutationFn: (v: { id: string; method: PaymentMethod }) => service.markPaid(v.id, v.method),
    ...refresh,
  });
  const cancel = useMutation({ mutationFn: (id: string) => service.cancel(id), ...refresh });
  const visibleIds = new Set(students.map((s) => s.id));
  const value: Ctx = {
    charges: allowed ? (query.data ?? []).filter((c) => visibleIds.has(c.studentId)) : [],
    isLoading: allowed && (query.isPending || studentsLoading),
    error: query.error,
    create: (d) => create.mutateAsync(d),
    markPaid: (id, method) => markPaid.mutateAsync({ id, method }),
    cancel: (id) => cancel.mutateAsync(id),
  };
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("FinanceProvider is required");
  return ctx;
}
