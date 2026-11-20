import type { Consent } from "@/types/consent";

export const TERM_VERSION = "2026-11-v1";
// Consentimentos fictícios da demonstração.
export const demoConsents: Consent[] = [
  {
    id: "c1",
    studentId: "1",
    purpose: "tratamento",
    guardian: "Camila Oliveira",
    grantedOn: "2026-08-10",
    revokedOn: null,
    termVersion: TERM_VERSION,
  },
  {
    id: "c2",
    studentId: "1",
    purpose: "escola",
    guardian: "Camila Oliveira",
    grantedOn: "2026-08-10",
    revokedOn: null,
    termVersion: TERM_VERSION,
  },
  {
    id: "c3",
    studentId: "2",
    purpose: "tratamento",
    guardian: "Rafael Almeida",
    grantedOn: "2026-09-02",
    revokedOn: null,
    termVersion: TERM_VERSION,
  },
  {
    id: "c4",
    studentId: "2",
    purpose: "ia",
    guardian: "Rafael Almeida",
    grantedOn: "2026-09-02",
    revokedOn: "2026-10-15",
    termVersion: TERM_VERSION,
  },
];
