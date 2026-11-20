import { supabase } from "@/integrations/supabase/client";
import type { BillingPlan } from "@/services/billing-plans";

export async function listPlans(): Promise<BillingPlan[]> {
  const { data, error } = await supabase.from("billing_plans").select("*").order("duration_days");
  if (error) throw new Error("Não foi possível carregar os planos.");
  return data.map((r) => ({ id: r.id, name: r.name, durationDays: r.duration_days, active: r.active }));
}
export async function createPlan(name: string, durationDays: number) {
  const { error } = await supabase.from("billing_plans").insert({ name: name.trim(), duration_days: durationDays });
  if (error) throw new Error(error.code === "23505" ? "Já existe um plano com este nome." : "Não foi possível cadastrar o plano.");
}
export async function setPlanActive(id: string, active: boolean) {
  const { error } = await supabase.from("billing_plans").update({ active }).eq("id", id);
  if (error) throw new Error("Não foi possível alterar o plano.");
}
export async function assignPlan(tenantId: string, planId: string, validUntil: string) {
  const { error } = await supabase.from("tenants").update({ plan_id: planId, valid_until: validUntil }).eq("id", tenantId);
  if (error) throw new Error("Não foi possível registrar o plano do cliente.");
}
