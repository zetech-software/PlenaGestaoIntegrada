import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : null);

async function handle(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const data = event.data as any;
  const tenantId = data?.customData?.tenantId as string | undefined;
  if (!tenantId) return;
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled: {
      const patch: Record<string, unknown> = {
        subscription_id: data.id,
        subscription_status: event.eventType === EventName.SubscriptionCanceled ? "canceled" : data.status,
        subscription_env: env,
      };
      const end = day(data.currentBillingPeriod?.endsAt);
      if (end && env === "live") patch["valid_until"] = end;
      await supabaseAdmin.from("tenants").update(patch).eq("id", tenantId);
      break;
    }
    case EventName.TransactionCompleted: {
      const end = day(data.billingPeriod?.endsAt);
      const total = Number(data.details?.totals?.grandTotal ?? data.details?.totals?.total ?? 0);
      await supabaseAdmin.from("tenant_payments").upsert(
        {
          tenant_id: tenantId,
          amount_cents: total,
          paid_on: day(data.billedAt ?? data.createdAt) ?? new Date().toISOString().slice(0, 10),
          method: "Cartão",
          period_start: day(data.billingPeriod?.startsAt),
          period_end: end,
          notes: env === "sandbox" ? "Cobrança automática (teste)" : "Cobrança automática",
          external_id: data.id,
        },
        { onConflict: "external_id", ignoreDuplicates: true },
      );
      if (end && env === "live") await supabaseAdmin.from("tenants").update({ valid_until: end }).eq("id", tenantId);
      break;
    }
    case EventName.TransactionPaymentFailed:
      await supabaseAdmin.from("tenants").update({ subscription_status: "past_due" }).eq("id", tenantId);
      break;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = (new URL(request.url).searchParams.get("env") === "live" ? "live" : "sandbox") as PaddleEnv;
        try {
          await handle(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
