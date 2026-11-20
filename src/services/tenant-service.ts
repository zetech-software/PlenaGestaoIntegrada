import { demoDate } from "@/data/demo-students";
import type { Tenant, TenantDraft, TenantKind, TenantService, TenantStatus } from "@/types/tenant";

export const MAX_SEATS = 200;
export const onlyDigits = (value: string) => value.replace(/\D/g, "");
const allEqual = (digits: string) => /^(\d)\1+$/.test(digits);

export function isValidCpf(input: string) {
  const d = onlyDigits(input);
  if (d.length !== 11 || allEqual(d)) return false;
  const check = (len: number) => {
    const sum = d
      .slice(0, len)
      .split("")
      .reduce((total, digit, i) => total + Number(digit) * (len + 1 - i), 0);
    return ((sum * 10) % 11) % 10;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}
export function isValidCnpj(input: string) {
  const d = onlyDigits(input);
  if (d.length !== 14 || allEqual(d)) return false;
  const check = (len: number) => {
    const weights =
      len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = d
      .slice(0, len)
      .split("")
      .reduce((total, digit, i) => total + Number(digit) * (weights[i] ?? 0), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(d[12]) && check(13) === Number(d[13]);
}
export function isValidDocument(kind: TenantKind, input: string) {
  return kind === "clinica" ? isValidCnpj(input) : isValidCpf(input);
}
export function formatDocument(kind: TenantKind, input: string) {
  const d = onlyDigits(input);
  if (kind === "clinica" && d.length === 14)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (kind === "autonomo" && d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return input;
}
/** Retorna mensagem de erro ou null. Autônomo tem sempre 1 vaga; clínica de 1 a 200. */
export function validateTenant(draft: TenantDraft, existing: Tenant[]) {
  if (draft.name.trim().length < 3) return "Informe o nome do cliente.";
  if (!isValidDocument(draft.kind, draft.document))
    return draft.kind === "clinica" ? "CNPJ inválido." : "CPF inválido.";
  if (existing.some((t) => onlyDigits(t.document) === onlyDigits(draft.document)))
    return "Já existe um cliente com este documento.";
  if (draft.ownerName.trim().length < 3) return "Informe o nome do responsável.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.ownerEmail.trim()))
    return "E-mail do responsável inválido.";
  if (existing.some((t) => t.ownerEmail.toLowerCase() === draft.ownerEmail.trim().toLowerCase()))
    return "Já existe um cliente com este e-mail de responsável.";
  if (!Number.isInteger(draft.seats) || draft.seats < 1 || draft.seats > MAX_SEATS)
    return `A quantidade de profissionais deve ficar entre 1 e ${MAX_SEATS}.`;
  if (draft.kind === "autonomo" && draft.seats !== 1)
    return "Profissional autônomo usa uma única vaga.";
  return null;
}
export interface TenantFilter {
  query: string;
  kind: TenantKind | "Todos";
  status: TenantStatus | "Todos";
}
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function filterTenants(tenants: Tenant[], filter: TenantFilter) {
  const q = normalize(filter.query.trim());
  const digits = onlyDigits(filter.query);
  return tenants
    .filter(
      (t) =>
        (filter.kind === "Todos" || t.kind === filter.kind) &&
        (filter.status === "Todos" || t.status === filter.status) &&
        (!q ||
          normalize(`${t.name} ${t.ownerName} ${t.ownerEmail}`).includes(q) ||
          (digits.length > 0 && onlyDigits(t.document).includes(digits))),
    )
    .sort((a, b) => b.createdOn.localeCompare(a.createdOn) || a.name.localeCompare(b.name));
}
export function summarizeTenants(tenants: Tenant[]) {
  return {
    clinics: tenants.filter((t) => t.kind === "clinica").length,
    independents: tenants.filter((t) => t.kind === "autonomo").length,
    active: tenants.filter((t) => t.status === "Ativo").length,
    suspended: tenants.filter((t) => t.status === "Suspenso").length,
    seats: tenants.filter((t) => t.status !== "Suspenso").reduce((sum, t) => sum + t.seats, 0),
  };
}
// Troque por um adaptador Supabase que implemente TenantService quando o banco existir. A criação real
// (cliente, primeiro administrador e convite por e-mail) precisa de uma função de servidor com a chave
// de serviço; este adaptador em memória só registra o cadastro e não envia convite.
export class DemoTenantService implements TenantService {
  private items: Tenant[];
  private seq = 0;
  constructor(seed: Tenant[]) {
    this.items = seed.map((t) => ({ ...t }));
  }
  async list() {
    return this.items.map((t) => ({ ...t }));
  }
  async create(draft: TenantDraft) {
    const error = validateTenant(draft, this.items);
    if (error) throw new Error(error);
    const tenant: Tenant = {
      ...draft,
      name: draft.name.trim(),
      document: onlyDigits(draft.document),
      ownerName: draft.ownerName.trim(),
      ownerEmail: draft.ownerEmail.trim().toLowerCase(),
      phone: draft.phone.trim(),
      registration: draft.registration.trim(),
      id: `cliente-${++this.seq}`,
      status: "Em implantação",
      createdOn: demoDate,
    };
    this.items = [tenant, ...this.items];
    return { ...tenant };
  }
  async setStatus(id: string, status: TenantStatus) {
    if (!this.items.some((t) => t.id === id)) throw new Error("Cliente não encontrado.");
    this.items = this.items.map((t) => (t.id === id ? { ...t, status } : t));
  }
}
