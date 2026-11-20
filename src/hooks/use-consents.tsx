import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoConsentService } from "@/services/consent-service";
import { demoConsents } from "@/data/demo-consents";
import { useStudents } from "@/hooks/use-students";
import type { Consent, ConsentDraft, ConsentService } from "@/types/consent";
interface Ctx {
  consents: Consent[];
  isLoading: boolean;
  error: Error | null;
  grant: (draft: ConsentDraft) => Promise<Consent>;
  revoke: (id: string) => Promise<void>;
}
const ConsentContext = createContext<Ctx | null>(null);
const consentsKey = ["consents"] as const;
export function ConsentsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<ConsentService>(() => new DemoConsentService(demoConsents));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: consentsKey, queryFn: () => service.list() });
  const { students, isLoading: studentsLoading } = useStudents();
  const grant = useMutation({
    mutationFn: (draft: ConsentDraft) => service.grant(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consentsKey }),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => service.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consentsKey }),
  });
  const visibleIds = new Set(students.map((s) => s.id));
  const value: Ctx = {
    consents: (query.data ?? []).filter((c) => visibleIds.has(c.studentId)),
    isLoading: query.isPending || studentsLoading,
    error: query.error,
    grant: (draft) => grant.mutateAsync(draft),
    revoke: (id) => revoke.mutateAsync(id),
  };
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
export function useConsents() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("ConsentsProvider is required");
  return ctx;
}
