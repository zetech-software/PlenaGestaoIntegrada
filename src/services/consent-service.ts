import { demoDate } from "@/data/demo-students";
import { TERM_VERSION } from "@/data/demo-consents";
import type { Consent, ConsentDraft, ConsentPurpose, ConsentService } from "@/types/consent";

/** Consentimento vigente = concedido e não revogado. */
export function activeConsent(consents: Consent[], studentId: string, purpose: ConsentPurpose) {
  return consents.find(
    (c) => c.studentId === studentId && c.purpose === purpose && c.revokedOn === null,
  );
}
export function hasConsent(consents: Consent[], studentId: string, purpose: ConsentPurpose) {
  return activeConsent(consents, studentId, purpose) !== undefined;
}
/** Retorna mensagem de erro ou null. */
export function validateConsent(draft: ConsentDraft, existing: Consent[]) {
  if (draft.guardian.trim().length < 3) return "Informe o nome do responsável legal.";
  if (hasConsent(existing, draft.studentId, draft.purpose))
    return "Já existe um consentimento vigente para esta finalidade.";
  return null;
}
// Troque por um adaptador Supabase que implemente ConsentService quando o banco existir.
export class DemoConsentService implements ConsentService {
  private items: Consent[];
  private seq = 0;
  constructor(seed: Consent[]) {
    this.items = seed.map((c) => ({ ...c }));
  }
  async list() {
    return this.items.map((c) => ({ ...c }));
  }
  async grant(draft: ConsentDraft) {
    const error = validateConsent(draft, this.items);
    if (error) throw new Error(error);
    const consent: Consent = {
      id: `consent-${++this.seq}`,
      studentId: draft.studentId,
      purpose: draft.purpose,
      guardian: draft.guardian.trim(),
      grantedOn: demoDate,
      revokedOn: null,
      termVersion: TERM_VERSION,
    };
    this.items = [...this.items, consent];
    return { ...consent };
  }
  /** A revogação não apaga o registro: guarda a data, para fins de prova. */
  async revoke(id: string) {
    const target = this.items.find((c) => c.id === id);
    if (!target) throw new Error("Consentimento não encontrado.");
    if (target.revokedOn !== null) return;
    this.items = this.items.map((c) => (c.id === id ? { ...c, revokedOn: demoDate } : c));
  }
}
