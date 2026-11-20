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
/** Sessões canceladas não ocupam horário. */
export function findConflict(sessions: Session[], draft: SessionDraft) {
  const start = toMinutes(draft.start);
  const end = start + draft.duration;
  return sessions.find((x) => {
    if (x.date !== draft.date || x.status === "Cancelado") return false;
    const s = toMinutes(x.start);
    return start < s + x.duration && s < end;
  });
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
  async setStatus(id: string, status: SessionStatus) {
    this.items = this.items.map((x) => (x.id === id ? { ...x, status } : x));
  }
}
