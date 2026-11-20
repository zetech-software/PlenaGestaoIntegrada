import type { Specialty } from "@/types/record";

export interface Therapist {
  id: string;
  name: string;
  specialty: Specialty;
}
// Equipe fictícia da demonstração. O vínculo real terapeuta–aluno vive em
// student_assignments (Lovable Cloud); aqui ele alimenta apenas painel e relatórios.
export const demoTherapists: Therapist[] = [
  { id: "t1", name: "Marina Duarte", specialty: "Neuropsicopedagogia" },
  { id: "t2", name: "Rafael Nogueira", specialty: "Fonoaudiologia" },
  { id: "t3", name: "Beatriz Campos", specialty: "Psicologia" },
];
export const demoTherapistByStudent: Record<string, string> = {
  "1": "t1",
  "2": "t2",
  "3": "t3",
  "4": "t1",
  "5": "t3",
  "6": "t2",
  "7": "t1",
  "8": "t2",
};
