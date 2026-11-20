import type { Specialty } from "@/types/record";

export type WaitPeriod = "Manhã" | "Tarde" | "Qualquer";
export const waitPeriods: WaitPeriod[] = ["Manhã", "Tarde", "Qualquer"];
export type WaitStatus = "Aguardando" | "Agendado";
export interface WaitlistEntry {
  id: string;
  studentId: string;
  specialty: Specialty;
  period: WaitPeriod;
  notes: string;
  createdOn: string; // YYYY-MM-DD
  status: WaitStatus;
}
export type WaitlistDraft = Pick<WaitlistEntry, "studentId" | "specialty" | "period" | "notes">;
export interface WaitlistService {
  list(): Promise<WaitlistEntry[]>;
  add(draft: WaitlistDraft): Promise<WaitlistEntry>;
  setStatus(id: string, status: WaitStatus): Promise<void>;
  remove(id: string): Promise<void>;
}
