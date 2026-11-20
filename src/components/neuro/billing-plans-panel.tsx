import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, validatePlan, type BillingPlan, type SubscriptionTier } from "@/services/billing-plans";
import { createPlan, listPlans, listTiers, setPlanActive } from "@/services/billing-plans-supabase";

export const plansKey = ["billing-plans"] as const;
export function usePlans() {
  return useQuery({ queryKey: plansKey, queryFn: listPlans });
}

export function useTiers() {
  return useQuery({ queryKey: ["subscription-tiers"], queryFn: listTiers });
}

export function TiersPanel({ tiers }: { tiers: SubscriptionTier[] }) {
  return (
    <section className="form-section agenda-form" aria-labelledby="tiers-title">
      <h2 id="tiers-title">Planos e valores</h2>
      <div className="stats-grid">
        {tiers.map((t) => (
          <article className="stat-card" key={t.id}>
            <div className="stat-top">
              <strong>{t.name}</strong>
            </div>
            <small className="text-muted-foreground">{t.audience}</small>
            <div className="stat-value">
              {formatBRL(t.monthlyCents)}
              <small className="text-sm font-normal"> /mês</small>
            </div>
            <div className="stat-foot">
              {t.extraSeatCents
                ? `+ ${formatBRL(t.extraSeatCents)} por terapeuta adicional`
                : `ou ${formatBRL(t.annualMonthlyCents)}/mês no plano anual`}
            </div>
            <div className="stat-foot">
              Vagas: {t.maxSeats === null ? `a partir de ${t.minSeats}` : t.maxSeats === 1 ? "1" : `até ${t.maxSeats}`}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BillingPlansPanel({ plans }: { plans: BillingPlan[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [days, setDays] = useState("30");
  const [error, setError] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: plansKey });
  const add = useMutation({ mutationFn: () => createPlan(name, Number(days)), onSuccess: refresh });
  const toggle = useMutation({
    mutationFn: (p: BillingPlan) => setPlanActive(p.id, !p.active),
    onSuccess: refresh,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const invalid = validatePlan(name, Number(days), plans);
    if (invalid) return setError(invalid);
    try {
      await add.mutateAsync();
      setName("");
      setDays("30");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar o plano.");
    }
  }

  return (
    <section className="form-section agenda-form" aria-labelledby="plans-title">
      <h2 id="plans-title" className="flex items-center gap-2">
        <CreditCard size={18} /> Ciclos de pagamento (validade)
      </h2>
      <div className="schedule">
        {plans.map((p) => (
          <div className="appointment" key={p.id}>
            <div className="appointment-info">
              <strong>{p.name}</strong>
              <small>
                Validade de {p.durationDays} {p.durationDays === 1 ? "dia" : "dias"}
              </small>
            </div>
            <span className={`status ${p.active ? "" : "muted"}`}>{p.active ? "Ativo" : "Inativo"}</span>
            <Button variant="outline" size="sm" onClick={() => toggle.mutate(p)}>
              {p.active ? "Desativar" : "Reativar"}
            </Button>
          </div>
        ))}
      </div>
      <form className="form-grid mt-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="form-field">
          <label htmlFor="plan-name">Nome do plano</label>
          <Input id="plan-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="plan-days">Validade (dias)</label>
          <Input
            id="plan-days"
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <div className="form-field justify-end">
          <Button type="submit" disabled={add.isPending}>
            Cadastrar plano
          </Button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive mt-2">
          {error}
        </p>
      ) : null}
    </section>
  );
}
