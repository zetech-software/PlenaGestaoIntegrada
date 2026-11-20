import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { subscriptionItems } from "@/services/subscription-items";

type Env = "sandbox" | "live";

/** Monta a assinatura da própria clínica (só administrador) com os preços cadastrados. */
export const prepareSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: Env; annual: boolean }) => ({
    environment: (d.environment === "live" ? "live" : "sandbox") as Env,
    annual: Boolean(d.annual),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_tenant_admin");
    if (!isAdmin) throw new Error("Só o administrador da clínica pode contratar a assinatura.");
    const { data: tenantId } = await context.supabase.rpc("current_tenant_id");
    const { data: tenant } = await context.supabase
      .from("tenants").select("id, seats, tier_id, owner_email").eq("id", tenantId as string).maybeSingle();
    if (!tenant?.tier_id) throw new Error("Sua clínica ainda não tem plano definido. Fale com a Ze Tech.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tier } = await supabaseAdmin
      .from("subscription_tiers").select("code, included_seats").eq("id", tenant.tier_id).single();
    if (!tier) throw new Error("Plano não encontrado.");
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const items = [];
    for (const it of subscriptionItems(tier.code, tenant.seats, tier.included_seats, data.annual)) {
      const res = await gatewayFetch(data.environment, `/prices?external_id=${encodeURIComponent(it.priceId)}`);
      const json = (await res.json()) as { data?: { id: string }[] };
      const id = json.data?.[0]?.id;
      if (!id) throw new Error("Preço não encontrado na cobrança.");
      items.push({ priceId: id, quantity: it.quantity });
    }
    return { items, tenantId: tenant.id, email: tenant.owner_email, userId: context.userId };
  });
