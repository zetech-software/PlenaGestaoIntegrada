import type { WaitlistEntry } from "@/types/waitlist";

export const demoWaitlist: WaitlistEntry[] = [
  {
    id: "w1",
    studentId: "6",
    specialty: "Fonoaudiologia",
    period: "Tarde",
    notes: "Retorno após pausa.",
    createdOn: "2026-11-02",
    status: "Aguardando",
  },
  {
    id: "w2",
    studentId: "3",
    specialty: "Psicologia",
    period: "Manhã",
    notes: "",
    createdOn: "2026-11-09",
    status: "Aguardando",
  },
];
