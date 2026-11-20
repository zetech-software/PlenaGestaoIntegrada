import type { Anamnesis, RecordEntry } from "@/types/record";
import type { Consent } from "@/types/consent";
import type { InterventionPlan } from "@/types/plan";
import type { Session } from "@/types/session";
import type { Student } from "@/types/student";

/** Prazo mínimo de guarda do prontuário (Lei 13.787/2018). Confirmar com assessoria jurídica. */
export const RETENTION_YEARS = 20;
/** Data mais recente + prazo de guarda; null quando não há registros. */
export function retentionUntil(dates: string[], years = RETENTION_YEARS) {
  const last = [...dates].filter(Boolean).sort().at(-1);
  if (!last) return null;
  const [y = 0, m = 1, d = 1] = last.split("-").map(Number);
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}
export interface StudentExportInput {
  student: Student;
  anamnesis: Anamnesis | undefined;
  records: RecordEntry[];
  sessions: Session[];
  plans: InterventionPlan[];
  consents: Consent[];
  exportedAt: string;
}
/** Todos os dados de um aluno em uma estrutura só (acesso e portabilidade, LGPD). */
export function buildStudentExport(input: StudentExportInput) {
  const id = input.student.id;
  const records = input.records.filter((r) => r.studentId === id);
  const sessions = input.sessions.filter((s) => s.studentId === id);
  const dates = [
    ...records.map((r) => r.date),
    ...sessions.filter((s) => s.status === "Realizado").map((s) => s.date),
    ...(input.anamnesis ? [input.anamnesis.updatedAt] : []),
  ];
  return {
    exportedAt: input.exportedAt,
    source: "Plena Gestão Integrada",
    student: input.student,
    anamnesis: input.anamnesis ?? null,
    records,
    sessions,
    plans: input.plans.filter((p) => p.studentId === id),
    consents: input.consents.filter((c) => c.studentId === id),
    retention: { minimumYears: RETENTION_YEARS, retainUntil: retentionUntil(dates) },
  };
}
export function exportFileName(student: Pick<Student, "id" | "name">) {
  const slug = student.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `plena-${slug || student.id}-dados.json`;
}
