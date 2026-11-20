import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoSessionService } from "@/services/session-service";
import { demoSessions } from "@/data/demo-sessions";
import { useStudents } from "@/hooks/use-students";
import type { Session, SessionDraft, SessionService, SessionStatus } from "@/types/session";
interface Ctx {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  addSession: (draft: SessionDraft) => Promise<Session>;
  setStatus: (id: string, status: SessionStatus) => Promise<void>;
}
const SessionContext = createContext<Ctx | null>(null);
const sessionsKey = ["sessions"] as const;
export function SessionsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<SessionService>(() => new DemoSessionService(demoSessions));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: sessionsKey, queryFn: () => service.list() });
  const { students, isLoading: studentsLoading } = useStudents();
  const create = useMutation({
    mutationFn: (draft: SessionDraft) => service.create(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
  const changeStatus = useMutation({
    mutationFn: (vars: { id: string; status: SessionStatus }) =>
      service.setStatus(vars.id, vars.status),
    // Atualiza a tela na hora; se a gravação falhar, volta ao valor anterior.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: sessionsKey });
      const previous = queryClient.getQueryData<Session[]>(sessionsKey);
      queryClient.setQueryData<Session[]>(sessionsKey, (current) =>
        current?.map((x) => (x.id === id ? { ...x, status } : x)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(sessionsKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
  const visibleIds = new Set(students.map((x) => x.id));
  const value: Ctx = {
    sessions: (query.data ?? []).filter((x) => visibleIds.has(x.studentId)),
    isLoading: query.isPending || studentsLoading,
    error: query.error,
    addSession: (draft) => create.mutateAsync(draft),
    setStatus: (id, status) => changeStatus.mutateAsync({ id, status }),
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("SessionsProvider is required");
  return ctx;
}
