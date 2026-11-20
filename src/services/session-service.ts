import type { Session, SessionDraft, SessionService, SessionStatus } from "@/types/session";

export function toMinutes(time: string) {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}
export function endTime(session: Pick<Session, "start" | "duration">) {
  const total = toMinutes(session.start) + session.duration;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
export function sessionsOn(sessions: Session[], date: string) {
  return sessions
    .filter((x) => x.date === date)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}
/** Segunda a sábado da semana que contém a data. */
export function weekDays(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return Array.from({ length: 6 }, (_, i) => {
    const day = new Date(d);
    day.setUTCDate(d.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/**
 * Conflito = horário sobreposto para o mesmo terapeuta ou para o mesmo aluno: dois terapeutas
 * podem atender ao mesmo tempo, mas ninguém está em dois lugares. Sessões canceladas não ocupam horário.
 */
export function findConflict(sessions: Session[], draft: SessionDraft) {
  const start = toMinutes(draft.start);
  const end = start + draft.duration;
  return sessions.find((x) => {
    if (x.date !== draft.date || x.status === "Cancelado") return false;
    if (x.therapistId !== draft.therapistId && x.studentId !== draft.studentId) return false;
    const s = toMinutes(x.start);
    return start < s + x.duration && s < end;
  });
}
export const MAX_RECURRENCE_WEEKS = 12;
/** A data e as repetições semanais seguintes (1 = sem repetição). */
export function recurrenceDates(date: string, weeks: number) {
  const count = Math.min(MAX_RECURRENCE_WEEKS, Math.max(1, Math.floor(weeks) || 1));
  return Array.from({ length: count }, (_, i) => shiftDate(date, 7 * i));
}
const shortDate = (date: string) => date.slice(8, 10) + "/" + date.slice(5, 7);
/** Datas em conflito de uma série; vazio quando todas cabem. */
export function recurrenceConflicts(existing: Session[], drafts: SessionDraft[]) {
  return drafts.filter((d) => findConflict(existing, d) !== undefined).map((d) => d.date);
}
export function conflictMessage(dates: string[]) {
  return dates.length === 1
    ? `Já existe um atendimento neste horário em ${shortDate(dates[0] ?? "")}.`
    : `Conflito de horário em: ${dates.map(shortDate).join(", ")}. Nenhuma sessão foi criada.`;
}
/** Frequência = realizados / (realizados + faltas). */
export function attendanceRate(sessions: Session[]) {
  const done = sessions.filter((x) => x.status === "Realizado").length;
  const missed = sessions.filter((x) => x.status === "Faltou").length;
  return done + missed === 0 ? null : Math.round((done / (done + missed)) * 100);
}
// Troque por um adaptador Supabase/REST que implemente SessionService quando o banco existir.
export class DemoSessionService implements SessionService {
  private items: Session[];
  private seq = 0;
  constructor(seed: Session[]) {
    this.items = seed.map((x) => ({ ...x }));
  }
  async list() {
    return this.items.map((x) => ({ ...x }));
  }
  async create(draft: SessionDraft): Promise<Session> {
    const conflict = findConflict(this.items, draft);
    if (conflict) throw new Error(`Já existe um atendimento às ${conflict.start} neste dia.`);
    const session: Session = { ...draft, id: `novo-${++this.seq}`, status: "Pendente" };
    this.items.push(session);
    return { ...session };
  }
  /** Tudo ou nada: se qualquer data conflitar, nenhuma sessão é criada. */
  async createMany(drafts: SessionDraft[]): Promise<Session[]> {
    const conflicts = recurrenceConflicts(this.items, drafts);
    if (conflicts.length) throw new Error(conflictMessage(conflicts));
    const created = drafts.map((d): Session => ({
      ...d,
      id: `novo-${++this.seq}`,
      status: "Pendente",
    }));
    this.items = [...this.items, ...created];
    return created.map((x) => ({ ...x }));
  }
  async setStatus(id: string, status: SessionStatus) {
    this.items = this.items.map((x) => (x.id === id ? { ...x, status } : x));
  }
}
