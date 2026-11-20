export type ConsentPurpose = "tratamento" | "escola" | "ia";
export interface ConsentPurposeInfo {
  id: ConsentPurpose;
  label: string;
  description: string;
}
export const consentPurposes: ConsentPurposeInfo[] = [
  {
    id: "tratamento",
    label: "Tratamento de dados de saúde e aprendizagem",
    description: "Cadastro, prontuário, planos de intervenção e relatórios do aluno.",
  },
  {
    id: "escola",
    label: "Compartilhamento com a escola",
    description: "Envio de relatórios e do PEI à escola indicada pelo responsável.",
  },
  {
    id: "ia",
    label: "Uso de inteligência artificial",
    description: "Sugestões de atividades geradas por IA a partir de observações sobre o aluno.",
  },
];
export interface Consent {
  id: string;
  studentId: string;
  purpose: ConsentPurpose;
  /** Responsável legal que concedeu o consentimento. */
  guardian: string;
  grantedOn: string; // YYYY-MM-DD
  revokedOn: string | null;
  termVersion: string;
}
export type ConsentDraft = Pick<Consent, "studentId" | "purpose" | "guardian">;
export interface ConsentService {
  list(): Promise<Consent[]>;
  grant(draft: ConsentDraft): Promise<Consent>;
  revoke(id: string): Promise<void>;
}
