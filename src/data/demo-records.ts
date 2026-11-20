import type { Anamnesis, RecordEntry } from "@/types/record";
export const demoAnamneses: Anamnesis[] = [
  {
    studentId: "1",
    specialty: "Neuropsicopedagogia",
    mainComplaint: "Família relata dificuldade em manter a atenção nas tarefas de leitura (dado fictício).",
    referral: "Escola",
    gestation: "Sem intercorrências relatadas.",
    development: "Marcos motores e de fala dentro do esperado, segundo a família.",
    health: "Sem uso de medicação relatado.",
    family: "Mora com mãe e irmã mais nova.",
    school: "Bom vínculo com colegas; demora para concluir atividades escritas.",
    expectations: "Ganhar autonomia e confiança na leitura.",
    updatedAt: "2026-08-10",
  },
];
export const demoRecords: RecordEntry[] = [
  {
    id: "r1", studentId: "1", date: "2026-11-06", specialty: "Neuropsicopedagogia",
    objectives: "Ampliar tempo de atenção sustentada.",
    activities: "Jogo da memória com sílabas; leitura compartilhada.",
    observations: "Manteve foco por cerca de 8 minutos.",
    evolution: "Estável", nextSteps: "Introduzir pausas programadas.",
  },
  {
    id: "r2", studentId: "1", date: "2026-11-13", specialty: "Neuropsicopedagogia",
    objectives: "Ampliar tempo de atenção sustentada.",
    activities: "Leitura com marcador visual e pausas programadas.",
    observations: "Manteve foco por cerca de 12 minutos e pediu para continuar.",
    evolution: "Avançou", nextSteps: "Levar estratégia do marcador para a sala de aula.",
  },
  {
    id: "r3", studentId: "2", date: "2026-11-12", specialty: "Fonoaudiologia",
    objectives: "Consciência fonológica.",
    activities: "Rimas com figuras.",
    observations: "Identificou 6 de 10 rimas.",
    evolution: "Estável", nextSteps: "Repetir com apoio visual.",
  },
];
