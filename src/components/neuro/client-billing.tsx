import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/services/student-service";
import {
  cycleChargeCents,
  formatBRL,
  isAnnualCycle,
  nextValidUntil,
  parseBRL,
  paymentMethods,
  paymentsTotal,
  tierMonthlyCents,
  tierSeatsError,
  type BillingPlan,
  type SubscriptionTier,
} from "@/services/billing-plans";
import { addPayment, listPayments, updateTenantPlan } from "@/services/billing-plans-supabase";
import type { Tenant } from "@/types/tenant";

/** Alteração de plano, ciclo e vagas de um cliente, sempre dentro das travas da faixa. */
export function ClientPlanEditor({
  tenant,
  tiers,
  plans,
  onDone,
}: {
  tenant: Tenant;
  tiers: SubscriptionTier[];
  plans: BillingPlan[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const independent = tenant.kind === "autonomo";
  const [tierId, setTierId] = useState(tenant.tierId ?? "");
  const [planId, setPlanId] = useState(tenant.planId ?? "");
  const [seats, setSeats] = useState(String(tenant.seats));
  const [error, setError] = useState("");
  const tier = tiers.find((t) => t.id === tierId);
  const cycle = plans.find((p) => p.id === planId);
  const n = independent ? 1 : Number(seats);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!tier || !cycle) return setError("Escolha o plano e o ciclo de pagamento.");
    const seatError = tierSeatsError(tier, n);
    if (seatError) return setError(seatError);
    try {
      await updateTenantPlan(tenant.id, tier.id, cycle.id, n);
      await qc.invalidateQueries({ queryKey: ["tenants"] });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar o cliente.");
    }
  }

  return (
    <form className="form-section agenda-form" onSubmit={(e) => void save(e)}>
      <h3 className="font-semibold">Alterar plano de {tenant.name}</h3>
      <div className="form-grid">
        <div className="form-field">
          <label>Plano</label>
          <Select
            value={tierId}
            onValueChange={(v) => {
              const t = tiers.find((x) => x.id === v);
              setTierId(v);
              if (t && tierSeatsError(t, Number(seats))) setSeats(String(t.maxSeats ?? t.minSeats));
            }}
          >
            <SelectTrigger className="bg-card" aria-label="Plano do cliente">
              <SelectValue placeholder="Escolha o plano" />
            </SelectTrigger>
            <SelectContent>
              {tiers
                .filter((t) => !independent || t.minSeats === 1)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.audience}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="form-field">
          <label>Ciclo de pagamento</label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger className="bg-card" aria-label="Ciclo do cliente">
              <SelectValue placeholder="Mensal ou anual" />
            </SelectTrigger>
            <SelectContent>
              {plans
                .filter((p) => p.active || p.id === tenant.planId)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.durationDays} dias
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {!independent ? (
          <div className="form-field">
            <label htmlFor={`seats-${tenant.id}`}>Vagas (administrador + terapeutas)</label>
            <Input
              id={`seats-${tenant.id}`}
              type="number"
              min={tier?.minSeats ?? 1}
              max={tier?.maxSeats ?? 200}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
        ) : null}
        <div className="form-field">
          <label>Valor</label>
          <p className="py-2">
            {tier && cycle
              ? `${formatBRL(tierMonthlyCents(tier, n, isAnnualCycle(cycle.durationDays)))}/mês`
              : "—"}
          </p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">Salvar alteração</Button>
      </div>
    </form>
  );
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Controle financeiro do cliente: histórico de pagamentos e registro de novo pagamento. */
export function ClientPayments({
  tenant,
  tiers,
  plans,
}: {
  tenant: Tenant;
  tiers: SubscriptionTier[];
  plans: BillingPlan[];
}) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const key = ["tenant-payments", tenant.id];
  const { data: payments = [], isPending } = useQuery({
    queryKey: key,
    queryFn: () => listPayments(tenant.id),
  });
  const tier = tiers.find((t) => t.id === tenant.tierId);
  const today = todayIso();
  const suggested = (planId: string) => {
    const c = plans.find((p) => p.id === planId);
    return tier && c
      ? (cycleChargeCents(tier, tenant.seats, c.durationDays) / 100).toFixed(2).replace(".", ",")
      : "";
  };
  const [planId, setPlanId] = useState(tenant.planId ?? "");
  const [amount, setAmount] = useState(suggested(tenant.planId ?? ""));
  const [paidOn, setPaidOn] = useState(today);
  const [method, setMethod] = useState<string>("Pix");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cycle = plans.find((p) => p.id === planId);
  const refund = method === "Estorno";
  const periodStart = tenant.validUntil && tenant.validUntil > today ? tenant.validUntil : today;
  const periodEnd = cycle ? nextValidUntil(today, cycle.durationDays, tenant.validUntil) : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    let cents = parseBRL(amount);
    if (Number.isNaN(cents) || cents <= 0) return setError("Informe um valor válido.");
    if (refund) cents = -cents;
    if (!refund && !cycle) return setError("Escolha o ciclo pago.");
    if (!session) return;
    try {
      await addPayment(
        {
          tenantId: tenant.id,
          amountCents: cents,
          paidOn,
          method,
          planId: refund ? null : (cycle?.id ?? null),
          tierId: tenant.tierId ?? null,
          periodStart: refund ? null : periodStart,
          periodEnd: refund ? null : periodEnd,
          notes: notes.trim().slice(0, 300),
        },
        session.user.id,
        !refund,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: key }),
        qc.invalidateQueries({ queryKey: ["tenants"] }),
      ]);
      setNotice(
        refund
          ? "Estorno registrado."
          : `Pagamento registrado. Validade até ${periodEnd ? formatDate(periodEnd) : "—"}.`,
      );
      setError("");
      setNotes("");
    } catch (err) {
      setNotice("");
      setError(err instanceof Error ? err.message : "Não foi possível registrar.");
    }
  }

  return (
    <section className="form-section agenda-form" aria-label={`Financeiro de ${tenant.name}`}>
      <h3 className="font-semibold">Financeiro · {tenant.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Total recebido: <strong>{formatBRL(paymentsTotal(payments))}</strong> · {payments.length}{" "}
        lançamento(s)
      </p>
      <form className="form-grid" onSubmit={(e) => void save(e)}>
        <div className="form-field">
          <label>Forma</label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="bg-card" aria-label="Forma de pagamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!refund ? (
          <div className="form-field">
            <label>Ciclo pago</label>
            <Select
              value={planId}
              onValueChange={(v) => {
                setPlanId(v);
                setAmount(suggested(v));
              }}
            >
              <SelectTrigger className="bg-card" aria-label="Ciclo pago">
                <SelectValue placeholder="Mensal ou anual" />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter((p) => p.active)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="form-field">
          <label htmlFor={`amt-${tenant.id}`}>Valor (R$)</label>
          <Input
            id={`amt-${tenant.id}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`paid-${tenant.id}`}>Data do pagamento</label>
          <Input
            id={`paid-${tenant.id}`}
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`notes-${tenant.id}`}>Observação</label>
          <Input
            id={`notes-${tenant.id}`}
            value={notes}
            maxLength={300}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Período coberto</label>
          <p className="py-2 text-sm">
            {refund || !periodEnd ? "—" : `${formatDate(periodStart)} a ${formatDate(periodEnd)}`}
          </p>
        </div>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm">
          {notice}
        </p>
      ) : null}
      <div className="form-actions">
        <Button onClick={(e) => void save(e as unknown as FormEvent)}>
          {refund ? "Registrar estorno" : "Registrar pagamento"}
        </Button>
      </div>
      <div className="schedule mt-3">
        {isPending ? <p role="status">Carregando pagamentos...</p> : null}
        {!isPending && payments.length === 0 ? (
          <p className="text-muted-foreground p-4">Nenhum pagamento registrado.</p>
        ) : null}
        {payments.map((p) => (
          <div className="appointment" key={p.id}>
            <div className="appointment-info">
              <strong>
                {formatBRL(p.amountCents)} · {p.method}
              </strong>
              <small>
                Pago em {formatDate(p.paidOn)}
                {p.planId ? ` · ${plans.find((x) => x.id === p.planId)?.name ?? ""}` : ""}
                {p.tierId ? ` · ${tiers.find((x) => x.id === p.tierId)?.name ?? ""}` : ""}
                {p.periodStart && p.periodEnd
                  ? ` · ${formatDate(p.periodStart)} a ${formatDate(p.periodEnd)}`
                  : ""}
                {p.notes ? ` · ${p.notes}` : ""}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
