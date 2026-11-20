import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoWaitlistService } from "@/services/waitlist-service";
import { demoWaitlist } from "@/data/demo-waitlist";
import { useStudents } from "@/hooks/use-students";
import type { WaitlistDraft, WaitlistEntry, WaitlistService, WaitStatus } from "@/types/waitlist";
interface Ctx {
  entries: WaitlistEntry[];
  isLoading: boolean;
  error: Error | null;
  add: (draft: WaitlistDraft) => Promise<WaitlistEntry>;
  setStatus: (id: string, status: WaitStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
const WaitlistContext = createContext<Ctx | null>(null);
const waitlistKey = ["waitlist"] as const;
export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [service] = useState<WaitlistService>(() => new DemoWaitlistService(demoWaitlist));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: waitlistKey, queryFn: () => service.list() });
  const { students, isLoading: studentsLoading } = useStudents();
  const refresh = { onSuccess: () => queryClient.invalidateQueries({ queryKey: waitlistKey }) };
  const add = useMutation({ mutationFn: (d: WaitlistDraft) => service.add(d), ...refresh });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: WaitStatus }) => service.setStatus(v.id, v.status),
    ...refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => service.remove(id), ...refresh });
  const visibleIds = new Set(students.map((s) => s.id));
  const value: Ctx = {
    entries: (query.data ?? []).filter((e) => visibleIds.has(e.studentId)),
    isLoading: query.isPending || studentsLoading,
    error: query.error,
    add: (d) => add.mutateAsync(d),
    setStatus: (id, status) => setStatus.mutateAsync({ id, status }),
    remove: (id) => remove.mutateAsync(id),
  };
  return <WaitlistContext.Provider value={value}>{children}</WaitlistContext.Provider>;
}
export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error("WaitlistProvider is required");
  return ctx;
}
