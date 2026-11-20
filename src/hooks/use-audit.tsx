import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DemoAuditService } from "@/services/audit-service";
import { useAuth } from "@/hooks/use-auth";
import type { AuditAction, AuditEvent, AuditResource, AuditService } from "@/types/audit";
interface Ctx {
  /** Só administradores leem o registro de auditoria. */
  events: AuditEvent[];
  isLoading: boolean;
  log: (
    action: AuditAction,
    resource: AuditResource,
    studentId: string | null,
    detail?: string,
  ) => void;
}
const AuditContext = createContext<Ctx | null>(null);
const auditKey = ["audit"] as const;
const DEDUPE_MS = 1000;
export function AuditProvider({ children }: { children: ReactNode }) {
  const [service] = useState<AuditService>(() => new DemoAuditService());
  const queryClient = useQueryClient();
  const { session, role } = useAuth();
  const query = useQuery({
    queryKey: auditKey,
    queryFn: () => service.list(),
    enabled: role === "admin",
  });
  const record = useMutation({
    mutationFn: (draft: Parameters<AuditService["record"]>[0]) => service.record(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auditKey }),
  });
  const last = useRef<{ key: string; at: number } | null>(null);
  const value: Ctx = {
    events: query.data ?? [],
    isLoading: role === "admin" && query.isPending,
    log(action, resource, studentId, detail = "") {
      // O registro nunca pode quebrar a tela; sem usuário identificado não há o que registrar.
      const userEmail = session?.user.email;
      if (!userEmail || !role) return;
      // Evita duplicar a mesma visualização (React em modo estrito monta duas vezes).
      const key = `${userEmail}|${action}|${resource}|${studentId}|${detail}`;
      const now = Date.now();
      if (last.current?.key === key && now - last.current.at < DEDUPE_MS) return;
      last.current = { key, at: now };
      record.mutate({ userEmail, role, action, resource, studentId, detail });
    },
  };
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("AuditProvider is required");
  return ctx;
}
/** Registra que o usuário abriu um recurso de um aluno. */
export function useAuditView(resource: AuditResource, studentId: string, enabled = true) {
  const { log } = useAudit();
  useEffect(() => {
    if (enabled) log("visualizou", resource, studentId);
    // `log` muda a cada render; só a abertura do recurso deve gerar evento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, studentId, enabled]);
}
