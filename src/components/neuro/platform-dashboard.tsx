import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tenant } from "@/types/tenant";
import { daysLeft, formatBRL, revenueByTier, validityState, type BillingPlan, type SubscriptionTier } from "@/services/billing-plans";
import { formatDate } from "@/services/student-service";

export function PlatformDashboard({ tenants, today, tiers = [], plans = [] }: { tenants: Tenant[]; today: string; tiers?: SubscriptionTier[]; plans?: BillingPlan[] }) {
  const report = revenueByTier(tiers, tenants.map((t) => ({ ...t, planDays: plans.find((p) => p.id === t.planId)?.durationDays })));
  const sum = report.reduce((a, r) => ({ revenue: a.revenue + r.revenue, cost: a.cost + r.cost, margin: a.margin + r.margin }), { revenue: 0, cost: 0, margin: 0 });
  const usage = useQuery({
    queryKey: ["tenant-seat-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tenant_seat_usage");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.tenant_id, r.used]));
    },
  }).data;
  const live = tenants.filter((t) => t.status !== "Suspenso");
  const used = (t: Tenant) => usage?.get(t.id) ?? 0;
  const total = live.reduce((s, t) => s + t.seats, 0);
  const filled = live.reduce((s, t) => s + Math.min(used(t), t.seats), 0);
  const states = tenants.map((t) => validityState(t.validUntil, today));
  const count = (s: string) => states.filter((x) => x === s).length;
  const expiring = tenants
    .filter((t) => t.validUntil)
    .sort((a, b) => a.validUntil!.localeCompare(b.validUntil!));

  const card = (label: string, value: string | number, hint?: string) => (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <section className="space-y-4" aria-label="Dashboard">
      <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {card("Vagas contratadas", total, "clientes não suspensos")}
        {card("Vagas preenchidas", filled)}
        {card("Vagas faltantes", total - filled)}
        {card("Vigentes", count("vigente"))}
        {card("Vencendo (≤7 dias)", count("vencendo"))}
        {card("Vencidos / sem plano", count("vencido") + count("sem-plano"))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-medium text-foreground">Vencimentos</h3>
          <ul className="divide-y text-sm">
            {expiring.length === 0 && <li className="py-2 text-muted-foreground">Nenhum cliente com validade.</li>}
            {expiring.map((t) => {
              const s = validityState(t.validUntil, today);
              const left = daysLeft(t.validUntil!, today);
              return (
                <li key={t.id} className="flex justify-between gap-2 py-2">
                  <span className="text-foreground">{t.name}</span>
                  <span className={s === "vigente" ? "text-muted-foreground" : "font-medium text-destructive"}>
                    {formatDate(t.validUntil!)} · {s === "vencido" ? `vencido há ${-left} d` : `${left} d`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-medium text-foreground">Ocupação de vagas</h3>
          <ul className="space-y-3 text-sm">
            {live.map((t) => {
              const u = used(t);
              const pct = t.seats ? Math.min(100, Math.round((u / t.seats) * 100)) : 0;
              return (
                <li key={t.id}>
                  <div className="flex justify-between">
                    <span className="text-foreground">{t.name}</span>
                    <span className="text-muted-foreground">{u} de {t.seats} · faltam {Math.max(0, t.seats - u)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-medium text-foreground">Receita, custo e margem por plano (mensal)</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="py-1">Plano</th><th>Clientes</th><th>Receita</th><th>Custo</th><th>Margem</th></tr>
          </thead>
          <tbody className="divide-y">
            {report.map((r) => (
              <tr key={r.tier.id}>
                <td className="py-2 text-foreground">{r.tier.name}</td><td>{r.clients}</td>
                <td>{formatBRL(r.revenue)}</td><td>{formatBRL(r.cost)}</td>
                <td className={r.margin < 0 ? "text-destructive" : "text-foreground"}>{formatBRL(r.margin)} ({r.marginPct}%)</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td><td></td><td>{formatBRL(sum.revenue)}</td><td>{formatBRL(sum.cost)}</td><td>{formatBRL(sum.margin)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">Custo editável em cada plano (botão Editar em Planos e valores). Clientes suspensos não entram.</p>
      </div>
    </section>
  );
}
