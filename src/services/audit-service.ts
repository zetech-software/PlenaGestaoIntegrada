import type {
  AuditAction,
  AuditDraft,
  AuditEvent,
  AuditResource,
  AuditService,
} from "@/types/audit";

export interface AuditFilter {
  action: AuditAction | "Todas";
  studentId: string;
}
/** Mais recente primeiro. */
export function sortAudit(events: AuditEvent[]) {
  return [...events].sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
}
export function filterAudit(events: AuditEvent[], filter: AuditFilter) {
  return sortAudit(events).filter(
    (e) =>
      (filter.action === "Todas" || e.action === filter.action) &&
      (!filter.studentId || e.studentId === filter.studentId),
  );
}
export function describeAudit(action: AuditAction, resource: AuditResource) {
  return `${action} · ${resource}`;
}
// O registro é só de inclusão: não há como editar ou apagar eventos por este serviço.
// Troque por um adaptador Supabase (tabela audit_log) quando o banco existir.
export class DemoAuditService implements AuditService {
  private items: AuditEvent[] = [];
  private seq = 0;
  constructor(private readonly clock: () => string = () => new Date().toISOString()) {}
  async list() {
    return this.items.map((e) => ({ ...e }));
  }
  async record(draft: AuditDraft) {
    const event: AuditEvent = { ...draft, id: `audit-${++this.seq}`, at: this.clock() };
    this.items = [...this.items, event];
    return { ...event };
  }
}
