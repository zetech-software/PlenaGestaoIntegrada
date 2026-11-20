import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoSessionService } from "@/services/session-service";
import { demoSessions } from "@/data/demo-sessions";
import { useStudents } from "@/hooks/use-students";
import type { Session, SessionDraft, SessionStatus } from "@/types/session";
interface Ctx {
  sessions: Session[];
  addSession: (draft: SessionDraft) => Session;
  setStatus: (id: string, status: SessionStatus) => void;
}
const SessionContext = createContext<Ctx | null>(null);
export function SessionsProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new DemoSessionService(demoSessions));
  const [sessions, setSessions] = useState(() => service.list());
  const { students } = useStudents();
  const visibleIds = new Set(students.map((x) => x.id));
  const value: Ctx = {
    sessions: sessions.filter((x) => visibleIds.has(x.studentId)),
    addSession(draft) {
      const created = service.create(draft);
      setSessions(service.list());
      return created;
    },
    setStatus(id, status) {
      service.setStatus(id, status);
      setSessions(service.list());
    },
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("SessionsProvider is required");
  return ctx;
}
