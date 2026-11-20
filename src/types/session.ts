export type SessionStatus = "Pendente" | "Confirmado" | "Realizado" | "Faltou" | "Cancelado";
export const sessionStatuses: SessionStatus[] = ["Pendente", "Confirmado", "Realizado", "Faltou", "Cancelado"];
export interface Session {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  duration: number; // minutos
  type: string;
  status: SessionStatus;
}
export type SessionDraft = Omit<Session, "id" | "status">;
