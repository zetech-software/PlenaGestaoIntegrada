import { demoTherapistByStudent } from "@/data/demo-therapists";
import type { Session } from "@/types/session";
import { DEFAULT_SESSION_DURATION } from "@/services/session-calendar";
const s = (
  id: string,
  studentId: string,
  date: string,
  start: string,
  type: string,
  status: Session["status"],
): Session => ({
  id,
  studentId,
  therapistId: demoTherapistByStudent[studentId] ?? "t1",
  date,
  start,
  duration: DEFAULT_SESSION_DURATION,
  type,
  status,
});
export const demoSessions: Session[] = [
  s("s1", "1", "2026-11-16", "08:30", "Atendimento individual", "Realizado"),
  s("s2", "5", "2026-11-16", "14:00", "Atendimento individual", "Realizado"),
  s("s3", "2", "2026-11-17", "10:00", "Atendimento individual", "Faltou"),
  s("s4", "7", "2026-11-18", "09:00", "Atendimento individual", "Realizado"),
  s("s5", "8", "2026-11-18", "15:00", "Devolutiva à família", "Realizado"),
  s("s6", "4", "2026-11-19", "11:00", "Atendimento individual", "Cancelado"),
  s("s7", "1", "2026-11-20", "08:30", "Atendimento individual", "Confirmado"),
  s("s8", "2", "2026-11-20", "10:00", "Atendimento individual", "Confirmado"),
  s("s9", "3", "2026-11-20", "14:00", "Encontro inicial", "Confirmado"),
  s("s10", "4", "2026-11-20", "15:30", "Atendimento individual", "Pendente"),
  s("s11", "5", "2026-11-23", "14:00", "Atendimento individual", "Pendente"),
  s("s12", "7", "2026-11-24", "09:00", "Atendimento individual", "Pendente"),
];
