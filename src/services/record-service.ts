import { demoDate } from "@/data/demo-students";
import type { Anamnesis, AnamnesisDraft, RecordDraft, RecordEntry } from "@/types/record";

export const MIN_TEXT = 10;
/** Retorna mensagem de erro ou null. Queixa principal é obrigatória. */
export function validateAnamnesis(draft: AnamnesisDraft) {
  if (draft.mainComplaint.trim().length < MIN_TEXT)
    return `Descreva a queixa principal com pelo menos ${MIN_TEXT} caracteres.`;
  return null;
}
/** Registro de sessão exige data, objetivos e observações. */
export function validateRecord(draft: RecordDraft) {
  if (!draft.date) return "Informe a data da sessão.";
  if (draft.date > demoDate) return "Não é possível registrar uma sessão futura.";
  if (draft.objectives.trim().length < MIN_TEXT) return `Descreva os objetivos com pelo menos ${MIN_TEXT} caracteres.`;
  if (draft.observations.trim().length < MIN_TEXT) return `Descreva as observações com pelo menos ${MIN_TEXT} caracteres.`;
  return null;
}
/** Mais recente primeiro. */
export function recordsFor(records: RecordEntry[], studentId: string) {
  return records.filter((r) => r.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}
export function evolutionSummary(records: RecordEntry[]) {
  return {
    total: records.length,
    advanced: records.filter((r) => r.evolution === "Avançou").length,
    attention: records.filter((r) => r.evolution === "Precisa de atenção").length,
  };
}
export class DemoRecordService {
  private anamneses: Anamnesis[];
  private records: RecordEntry[];
  private seq = 0;
  constructor(anamneses: Anamnesis[], records: RecordEntry[]) {
    this.anamneses = anamneses.map((a) => ({ ...a }));
    this.records = records.map((r) => ({ ...r }));
  }
  listAnamneses() { return this.anamneses.map((a) => ({ ...a })); }
  listRecords() { return this.records.map((r) => ({ ...r })); }
  saveAnamnesis(draft: AnamnesisDraft) {
    const error = validateAnamnesis(draft);
    if (error) throw new Error(error);
    const saved: Anamnesis = { ...draft, updatedAt: demoDate };
    this.anamneses = [...this.anamneses.filter((a) => a.studentId !== draft.studentId), saved];
    return { ...saved };
  }
  addRecord(draft: RecordDraft) {
    const error = validateRecord(draft);
    if (error) throw new Error(error);
    const entry: RecordEntry = { ...draft, id: `reg-${++this.seq}` };
    this.records = [...this.records, entry];
    return { ...entry };
  }
}
