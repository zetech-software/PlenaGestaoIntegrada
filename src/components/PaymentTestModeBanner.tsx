import { getPaddleEnvironment } from "@/lib/paddle";
export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full rounded-md border border-accent bg-accent/30 px-4 py-2 text-center text-sm text-foreground">
      Cobrança em modo de teste: nenhum valor real é cobrado. Use o cartão 4242 4242 4242 4242.
    </div>
  );
}
