import { demoDate } from "@/data/demo-students";
import type { WaitlistDraft, WaitlistEntry, WaitlistService, WaitStatus } from "@/types/waitlist";

/** Retorna mensagem de erro ou null. Um aluno só entra uma vez por especialidade enquanto aguarda. */
export function validateWaitlist(draft: WaitlistDraft, existing: WaitlistEntry[]) {
  if (!draft.studentId) return "Escolha um aluno.";
  if (
    existing.some(
      (e) =>
        e.studentId === draft.studentId &&
        e.specialty === draft.specialty &&
        e.status === "Aguardando",
    )
  )
    return "Este aluno já está na lista de espera desta especialidade.";
  return null;
}
/** Quem espera há mais tempo vem primeiro. */
export function waitingQueue(entries: WaitlistEntry[]) {
  return entries
    .filter((e) => e.status === "Aguardando")
    .sort((a, b) => a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id));
}
// Troque por um adaptador Supabase que implemente WaitlistService quando o banco existir.
export class DemoWaitlistService implements WaitlistService {
  private items: WaitlistEntry[];
  private seq = 0;
  constructor(seed: WaitlistEntry[]) {
    this.items = seed.map((e) => ({ ...e }));
  }
  async list() {
    return this.items.map((e) => ({ ...e }));
  }
  async add(draft: WaitlistDraft) {
    const error = validateWaitlist(draft, this.items);
    if (error) throw new Error(error);
    const entry: WaitlistEntry = {
      ...draft,
      notes: draft.notes.trim(),
      id: `espera-${++this.seq}`,
      createdOn: demoDate,
      status: "Aguardando",
    };
    this.items = [...this.items, entry];
    return { ...entry };
  }
  async setStatus(id: string, status: WaitStatus) {
    this.items = this.items.map((e) => (e.id === id ? { ...e, status } : e));
  }
  async remove(id: string) {
    this.items = this.items.filter((e) => e.id !== id);
  }
}
