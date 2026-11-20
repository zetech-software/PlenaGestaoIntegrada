export type AuditAction = "visualizou" | "criou" | "editou" | "exportou" | "consentiu" | "revogou";
export const auditActions: AuditAction[] = [
  "visualizou",
  "criou",
  "editou",
  "exportou",
  "consentiu",
  "revogou",
];
export type AuditResource =
  "aluno" | "anamnese" | "prontuario" | "plano" | "consentimento" | "dados do aluno";
export interface AuditEvent {
  id: string;
  at: string; // ISO 8601
  userEmail: string;
  role: string;
  action: AuditAction;
  resource: AuditResource;
  studentId: string | null;
  detail: string;
}
export type AuditDraft = Omit<AuditEvent, "id" | "at">;
export interface AuditService {
  list(): Promise<AuditEvent[]>;
  record(draft: AuditDraft): Promise<AuditEvent>;
}
