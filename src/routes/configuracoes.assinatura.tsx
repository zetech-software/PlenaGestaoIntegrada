import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getPaddleEnvironment, initializePaddle } from "@/lib/paddle";
import { prepareSubscriptionCheckout } from "@/utils/payments.functions";

export const Route = createFileRoute("/configuracoes/assinatura")({
  head: () => ({
    meta: [
      { title: "Assinatura | Plena Gestão Integrada" },
      { name: "description", content: "Contrate e renove automaticamente a assinatura da clínica." },
      { property: "og:title", content: "Assinatura | Plena Gestão Integrada" },
      { property: "og:description", content: "Cobrança automática da assinatura da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  async function pay(annual: boolean) {
    setLoading(true);
    setMsg("");
    try {
      const environment = getPaddleEnvironment();
      const r = await prepareSubscriptionCheckout({ data: { environment, annual } });
      await initializePaddle();
      window.Paddle.Checkout.open({
        items: r.items,
        customer: r.email ? { email: r.email } : undefined,
        customData: { tenantId: r.tenantId, userId: r.userId },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/configuracoes/assinatura?pago=1`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não foi possível abrir o pagamento.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="max-w-xl space-y-4">
      <PaymentTestModeBanner />
      <h2 className="text-lg font-semibold text-foreground">Assinatura automática</h2>
      <p className="text-sm text-muted-foreground">
        O valor segue o plano e as vagas da sua clínica. A cobrança se renova sozinha e a validade é
        atualizada a cada pagamento confirmado.
      </p>
      <div className="flex gap-2">
        <Button disabled={loading} onClick={() => void pay(false)}>Assinar mensal</Button>
        <Button disabled={loading} variant="outline" onClick={() => void pay(true)}>Assinar anual (15% off)</Button>
      </div>
      {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
    </section>
  );
}
