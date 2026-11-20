export const specialties = [
  "Neuropsicopedagogia",
  "Psicologia",
  "Fonoaudiologia",
  "Terapia ocupacional",
  "Psicopedagogia",
  "Fisioterapia",
] as const;
export type Specialty = (typeof specialties)[number];
export type Evolution = "Avançou" | "Estável" | "Precisa de atenção";
export const evolutions: Evolution[] = ["Avançou", "Estável", "Precisa de atenção"];

export interface Anamnesis {
  studentId: string;
  specialty: Specialty;
  mainComplaint: string;
  referral: string;
  gestation: string;
  development: string;
  health: string;
  family: string;
  school: string;
  expectations: string;
  updatedAt: string;
}
export type AnamnesisDraft = Omit<Anamnesis, "updatedAt">;

export interface RecordEntry {
  id: string;
  studentId: string;
  date: string;
  specialty: Specialty;
  objectives: string;
  activities: string;
  observations: string;
  evolution: Evolution;
  nextSteps: string;
}
export type RecordDraft = Omit<RecordEntry, "id">;
export interface RecordService {
  listAnamneses(): Promise<Anamnesis[]>;
  listRecords(): Promise<RecordEntry[]>;
  saveAnamnesis(draft: AnamnesisDraft): Promise<Anamnesis>;
  addRecord(draft: RecordDraft): Promise<RecordEntry>;
}
