import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatBRL,
  parseBRL,
  validatePlan,
  validateTier,
  type BillingPlan,
  type SubscriptionTier,
} from "@/services/billing-plans";
import {
  createPlan,
  listPlans,
  listTiers,
  setPlanActive,
  updateTier,
} from "@/services/billing-plans-supabase";

export const plansKey = ["billing-plans"] as const;
export function usePlans() {
  return useQuery({ queryKey: plansKey, queryFn: listPlans });
}

export function useTiers() {
  return useQuery({ queryKey: ["subscription-tiers"], queryFn: listTiers });
}

const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

function TierCard({ tier }: { tier: SubscriptionTier }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    monthly: reais(tier.monthlyCents),
    annual: reais(tier.annualMonthlyCents),
    extra: reais(tier.extraSeatCents),
    extraAnnual: reais(tier.extraSeatAnnualCents),
    cost: reais(tier.costCents ?? 0),
    min: String(tier.minSeats),
    max: tier.maxSeats === null ? "" : String(tier.maxSeats),
    included: String(tier.includedSeats),
  });
  const [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    const next: SubscriptionTier = {
      ...tier,
      monthlyCents: parseBRL(f.monthly),
      annualMonthlyCents: parseBRL(f.annual),
      extraSeatCents: parseBRL(f.extra),
      extraSeatAnnualCents: parseBRL(f.extraAnnual),
      costCents: parseBRL(f.cost),
      minSeats: Number(f.min),
      maxSeats: f.max.trim() === "" ? null : Number(f.max),
      includedSeats: Number(f.included),
    };
    const invalid = [
      next.monthlyCents,
      next.annualMonthlyCents,
      next.extraSeatCents,
      next.extraSeatAnnualCents,
      next.costCents ?? 0,
    ].some(Number.isNaN)
      ? "Valor inválido."
      : validateTier(next);
    if (invalid) return setError(invalid);
    try {
      await updateTier(next);
      await qc.invalidateQueries({ queryKey: ["subscription-tiers"] });
      setError("");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }
  const field = (key: keyof typeof f, label: string, hint?: string) => (
    <div className="form-field">
      <label htmlFor={`${tier.code}-${key}`}>{label}</label>
      <Input
        id={`${tier.code}-${key}`}
        value={f[key]}
        placeholder={hint}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
      />
    </div>
  );
  return (
    <article className="stat-card">
      <div className="stat-top">
        <strong>{tier.name}</strong>
        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? "Fechar" : "Editar"}
        </Button>
      </div>
      <small className="text-muted-foreground">{tier.audience}</small>
      <div className="stat-value">
        {formatBRL(tier.monthlyCents)}
        <small className="text-sm font-normal"> /mês</small>
      </div>
      <div className="stat-foot">ou {formatBRL(tier.annualMonthlyCents)}/mês no plano anual</div>
      {tier.extraSeatCents ? (
        <div className="stat-foot">+ {formatBRL(tier.extraSeatCents)} por terapeuta adicional</div>
      ) : null}
      <div className="stat-foot">
        Vagas:{" "}
        {tier.maxSeats === null
          ? `a partir de ${tier.minSeats}`
          : tier.minSeats === tier.maxSeats
            ? tier.maxSeats
            : `${tier.minSeats} a ${tier.maxSeats}`}{" "}
        · incluídas {tier.includedSeats}
      </div>
      {editing ? (
        <form className="mt-3 grid gap-2" onSubmit={(e) => void save(e)}>
          {field("monthly", "Valor mensal (R$)")}
          {field("annual", "Valor por mês no anual (R$)")}
          {field("extra", "Adicional por vaga extra (R$)")}
          {field("extraAnnual", "Adicional por vaga no anual (R$)")}
          {field("min", "Mínimo de vagas")}
          {field("max", "Máximo de vagas", "vazio = sem limite")}
          {field("included", "Vagas incluídas no valor")}
          {field("cost", "Custo mensal por cliente (R$)")}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit">Salvar plano</Button>
        </form>
      ) : null}
    </article>
  );
}

export function TiersPanel({ tiers }: { tiers: SubscriptionTier[] }) {
  return (
    <section className="form-section agenda-form" aria-labelledby="tiers-title">
      <h2 id="tiers-title">Planos e valores</h2>
      <div className="stats-grid items-start">
        {tiers.map((t) => (
          <TierCard key={`${t.id}-${t.monthlyCents}-${t.minSeats}-${t.maxSeats}`} tier={t} />
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
            <span className={`status ${p.active ? "" : "muted"}`}>
              {p.active ? "Ativo" : "Inativo"}
            </span>
            <Button variant="outline" size="sm" onClick={() => toggle.mutate(p)}>
              {p.active ? "Desativar" : "Reativar"}
            </Button>
          </div>
        ))}
      </div>
      <form className="form-grid mt-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="form-field">
          <label htmlFor="plan-name">Nome do plano</label>
          <Input
            id="plan-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
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
