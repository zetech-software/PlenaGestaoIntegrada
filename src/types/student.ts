export type StudentStatus = "Ativo" | "Em avaliação" | "Inativo";
export interface Student {
  id: string;
  name: string;
  birthDate: string;
  school: string;
  grade: string;
  guardian: string;
  relationship: string;
  phone: string;
  email: string;
  status: StudentStatus;
  startDate: string;
  notes: string;
  tone: "green" | "warm" | "info";
}
export type StudentDraft = Omit<Student, "id" | "tone" | "startDate">;
export interface StudentService {
  list(): Promise<Student[]>;
  get(id: string): Promise<Student | undefined>;
  create(draft: StudentDraft): Promise<Student>;
}
