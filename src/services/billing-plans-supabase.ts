import { supabase } from "@/integrations/supabase/client";
import type { BillingPlan, SubscriptionTier, TenantPayment } from "@/services/billing-plans";

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

export async function updateTier(t: SubscriptionTier) {
  const { error } = await supabase
    .from("subscription_tiers")
    .update({
      name: t.name.trim(),
      audience: t.audience.trim(),
      min_seats: t.minSeats,
      max_seats: t.maxSeats,
      included_seats: t.includedSeats,
      monthly_cents: t.monthlyCents,
      annual_monthly_cents: t.annualMonthlyCents,
      extra_seat_cents: t.extraSeatCents,
      extra_seat_annual_cents: t.extraSeatAnnualCents,
    })
    .eq("id", t.id);
  if (error) throw new Error("Não foi possível salvar o plano.");
}

export async function updateTenantPlan(tenantId: string, tierId: string, planId: string, seats: number) {
  const { error } = await supabase
    .from("tenants")
    .update({ tier_id: tierId, plan_id: planId, seats })
    .eq("id", tenantId);
  if (error)
    throw new Error(/aceita de|reduzir/.test(error.message) ? error.message : "Não foi possível alterar o cliente.");
}

export async function listPayments(tenantId: string): Promise<TenantPayment[]> {
  const { data, error } = await supabase
    .from("tenant_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os pagamentos.");
  return data.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    amountCents: r.amount_cents,
    paidOn: r.paid_on,
    method: r.method,
    planId: r.plan_id,
    tierId: r.tier_id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    notes: r.notes,
  }));
}

export async function addPayment(
  p: Omit<TenantPayment, "id">,
  userId: string,
  extendValidity: boolean,
) {
  const { error } = await supabase.from("tenant_payments").insert({
    tenant_id: p.tenantId,
    amount_cents: p.amountCents,
    paid_on: p.paidOn,
    method: p.method,
    plan_id: p.planId,
    tier_id: p.tierId,
    period_start: p.periodStart,
    period_end: p.periodEnd,
    notes: p.notes,
    created_by: userId,
  });
  if (error) throw new Error("Não foi possível registrar o pagamento.");
  if (extendValidity && p.periodEnd) {
    const { error: e2 } = await supabase
      .from("tenants")
      .update({ valid_until: p.periodEnd, ...(p.planId ? { plan_id: p.planId } : {}) })
      .eq("id", p.tenantId);
    if (e2) throw new Error("Pagamento registrado, mas a validade não foi atualizada.");
  }
}
