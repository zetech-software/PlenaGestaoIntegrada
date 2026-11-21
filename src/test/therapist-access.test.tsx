import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { StudentsProvider, useStudents } from "@/hooks/use-students";
import { SessionsProvider, useSessions } from "@/hooks/use-sessions";
import { DemoStudentService } from "@/services/student-service";
import { DemoSessionService } from "@/services/session-service";
import { demoStudents } from "@/data/demo-students";

vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ role: "terapeuta", assigned: ["1"] }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("painel do terapeuta", () => {
  it("limita alunos e agenda aos vínculos, inclusive registros demonstrativos", async () => {
    const student = demoStudents[0];
    if (!student) throw new Error("Fixture de aluno necessária");
    vi.spyOn(DemoStudentService.prototype, "list").mockResolvedValue([
      { ...student, id: "1" }, { ...student, id: "2" }, { ...student, id: "demo-unassigned" },
    ]);
    vi.spyOn(DemoSessionService.prototype, "list").mockResolvedValue([
      { id: "linked-session", studentId: "1", therapistId: "t1", date: "2026-11-20", start: "09:00", duration: 45, type: "Individual", status: "Confirmado" },
      { id: "other-session", studentId: "2", therapistId: "t2", date: "2026-11-20", start: "10:00", duration: 45, type: "Individual", status: "Confirmado" },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}><StudentsProvider><SessionsProvider>{children}</SessionsProvider></StudentsProvider></QueryClientProvider>;
    }
    const { result } = renderHook(() => ({ students: useStudents(), sessions: useSessions() }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.sessions.isLoading).toBe(false));
    expect(result.current.students.students.map((s) => s.id)).toEqual(["1"]);
    expect(result.current.sessions.sessions.map((s) => s.id)).toEqual(["linked-session"]);
  });
});