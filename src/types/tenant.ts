/** Cliente da plataforma: uma clínica (várias pessoas) ou um profissional autônomo (uma pessoa). */
export type TenantKind = "clinica" | "autonomo";
export const tenantKindLabels: Record<TenantKind, string> = {
  clinica: "Clínica",
  autonomo: "Profissional autônomo",
};
export type TenantStatus = "Em implantação" | "Ativo" | "Suspenso";
export const tenantStatuses: TenantStatus[] = ["Em implantação", "Ativo", "Suspenso"];
export interface Tenant {
  id: string;
  kind: TenantKind;
  /** Nome da clínica ou do profissional. */
  name: string;
  /** CNPJ (clínica) ou CPF (autônomo), só dígitos. */
  document: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  /** Registro no conselho profissional (autônomo), como "CRP 06/123456". */
  registration: string;
  /** Quantidade de profissionais que podem usar o sistema. */
  seats: number;
  status: TenantStatus;
  createdOn: string; // YYYY-MM-DD
  /** Plano de pagamento contratado e fim da validade (YYYY-MM-DD). */
  planId?: string | null;
  validUntil?: string | null;
  /** Faixa de plano (Consultório, Clínica, Multidisciplinar). */
  tierId?: string | null;
}
export type TenantDraft = Pick<
  Tenant,
  "kind" | "name" | "document" | "ownerName" | "ownerEmail" | "phone" | "registration" | "seats"
>;
export interface TenantService {
  list(): Promise<Tenant[]>;
  create(draft: TenantDraft): Promise<Tenant>;
  setStatus(id: string, status: TenantStatus): Promise<void>;
}
