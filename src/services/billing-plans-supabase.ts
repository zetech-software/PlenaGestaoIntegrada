import { supabase } from "@/integrations/supabase/client";
import type { BillingPlan, SubscriptionTier } from "@/services/billing-plans";

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
export async function listTiers(): Promise<SubscriptionTier[]> {
  const { data, error } = await supabase.from("subscription_tiers").select("*").order("position");
  if (error) throw new Error("Não foi possível carregar as faixas de plano.");
  return data.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    audience: r.audience,
    minSeats: r.min_seats,
    maxSeats: r.max_seats,
    includedSeats: r.included_seats,
    monthlyCents: r.monthly_cents,
    annualMonthlyCents: r.annual_monthly_cents,
    extraSeatCents: r.extra_seat_cents,
    extraSeatAnnualCents: r.extra_seat_annual_cents,
  }));
}
export async function assignPlan(
  tenantId: string,
  planId: string,
  validUntil: string,
  tier?: { tierId: string; seats: number },
) {
  const { error } = await supabase
    .from("tenants")
    .update({
      plan_id: planId,
      valid_until: validUntil,
      ...(tier ? { tier_id: tier.tierId, seats: tier.seats } : {}),
    })
    .eq("id", tenantId);
  if (error) throw new Error(/aceita de|reduzir/.test(error.message) ? error.message : "Não foi possível registrar o plano do cliente.");
}
