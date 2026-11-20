import { supabase } from "@/integrations/supabase/client";
import type { Tenant, TenantDraft, TenantService, TenantStatus } from "@/types/tenant";
import type { ProvisionResult } from "@/lib/tenants.functions";

type Row = {
  id: string; kind: string; name: string; document: string; owner_name: string; owner_email: string;
  phone: string; registration: string; seats: number; status: string; created_on: string;
};
const toTenant = (r: Row): Tenant => ({
  id: r.id,
  kind: r.kind as Tenant["kind"],
  name: r.name,
  document: r.document,
  ownerName: r.owner_name,
  ownerEmail: r.owner_email,
  phone: r.phone,
  registration: r.registration,
  seats: r.seats,
  status: r.status as TenantStatus,
  createdOn: r.created_on,
});

/** Clientes no banco; o cadastro passa pela função de servidor que também convida o responsável. */
export class SupabaseTenantService implements TenantService {
  constructor(private provision: (d: TenantDraft) => Promise<ProvisionResult>) {}
  async list() {
    const { data, error } = await supabase.from("tenants").select("*").order("name");
    if (error) throw new Error("Não foi possível carregar os clientes.");
    return (data as Row[]).map(toTenant);
  }
  async create(draft: TenantDraft) {
    const res = await this.provision(draft);
    if (res.error || !res.id) throw new Error(res.error ?? "Não foi possível cadastrar o cliente.");
    const { data, error } = await supabase.from("tenants").select("*").eq("id", res.id).single();
    if (error || !data) throw new Error("Cliente criado, mas não foi possível lê-lo.");
    return toTenant(data as Row);
  }
  async setStatus(id: string, status: TenantStatus) {
    const { error } = await supabase.from("tenants").update({ status }).eq("id", id);
    if (error) throw new Error("Não foi possível mudar a situação.");
  }
}
