import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenants } from "@/hooks/use-tenants";
import { formatDocument, filterTenants, summarizeTenants } from "@/services/tenant-service";
import { formatDate } from "@/services/student-service";
import {
  tenantKindLabels,
  tenantStatuses,
  type TenantKind,
  type TenantStatus,
} from "@/types/tenant";
import { DemoFooter } from "@/components/neuro/student-ui";
import { useQueryClient } from "@tanstack/react-query";
import { BillingPlansPanel, TiersPanel, usePlans, useTiers } from "@/components/neuro/billing-plans-panel";
import {
  daysLeft,
  formatBRL,
  isAnnualCycle,
  nextValidUntil,
  tierMonthlyCents,
  tierSeatsError,
  validityState,
  type BillingPlan,
} from "@/services/billing-plans";
import { assignPlan } from "@/services/billing-plans-supabase";

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const validityTone = { "sem-plano": "muted", vigente: "", vencendo: "info", vencido: "muted" } as const;
function validityText(validUntil: string | null | undefined, today: string) {
  const state = validityState(validUntil, today);
  if (!validUntil || state === "sem-plano") return "Sem plano";
  if (state === "vencido") return `Vencido em ${formatDate(validUntil)}`;
  const left = daysLeft(validUntil, today);
  return `Válido até ${formatDate(validUntil)} (${left} ${left === 1 ? "dia" : "dias"})`;
}

export const Route = createFileRoute("/plataforma")({
  head: () => ({
    meta: [
      { title: "Clientes da plataforma | Plena Gestão Integrada" },
      {
        name: "description",
        content:
          "Cadastro e acompanhamento de clínicas e profissionais autônomos que usam a plataforma.",
      },
      { property: "og:title", content: "Clientes da plataforma | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Painel do operador para cadastrar clínicas e profissionais autônomos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlatformPage,
});

const statusTone: Record<TenantStatus, string> = {
  "Em implantação": "info",
  Ativo: "",
  Suspenso: "muted",
};
const empty = {
  kind: "clinica" as TenantKind,
  name: "",
  document: "",
  ownerName: "",
  ownerEmail: "",
  phone: "",
  registration: "",
  seats: "5",
  planId: "",
  tierId: "",
};

function PlatformPage() {
  const { tenants, isLoading, create, setStatus } = useTenants();
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<TenantKind | "Todos">("Todos");
  const [status, setStatus_] = useState<TenantStatus | "Todos">("Todos");
  const summary = summarizeTenants(tenants);
  const rows = filterTenants(tenants, { query, kind, status });
  const independent = form.kind === "autonomo";
  const plansQuery = usePlans();
  const plans = plansQuery.data ?? [];
  const activePlans = plans.filter((p) => p.active);
  const tiers = useTiers().data ?? [];
  const formTier = tiers.find((t) => t.id === form.tierId);
  const qc = useQueryClient();
  const today = todayIso();
  const planName = (id?: string | null) => plans.find((p) => p.id === id)?.name ?? "";

  async function applyPlan(tenantId: string, plan: BillingPlan, current?: string | null) {
    await assignPlan(tenantId, plan.id, nextValidUntil(today, plan.durationDays, current));
    await qc.invalidateQueries({ queryKey: ["tenants"] });
  }
  async function renew(tenantId: string, planId: string, current?: string | null) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    try {
      await applyPlan(tenantId, plan, current);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível renovar o plano.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const seats = independent ? 1 : Number(form.seats);
    if (!formTier || !form.planId) {
      setError("Escolha o plano e o ciclo de pagamento.");
      return;
    }
    const seatError = tierSeatsError(formTier, seats);
    if (seatError) {
      setError(seatError);
      return;
    }
    try {
      const created = await create({
        kind: form.kind,
        name: form.name,
        document: form.document,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        phone: form.phone,
        registration: form.registration,
        seats: independent ? 1 : Number(form.seats),
      });
      const plan = plans.find((p) => p.id === form.planId);
      if (plan)
        await assignPlan(created.id, plan.id, nextValidUntil(today, plan.durationDays), {
          tierId: formTier.id,
          seats,
        });
      await qc.invalidateQueries({ queryKey: ["tenants"] });
      setNotice(
        `${created.name} cadastrado como "${created.status}". O convite por e-mail ainda não é enviado nesta demonstração.`,
      );
      setError("");
      setForm(empty);
      setShowForm(false);
    } catch (e) {
      setNotice("");
      setError(e instanceof Error ? e.message : "Não foi possível cadastrar o cliente.");
    }
  }
  async function change(id: string, next: TenantStatus) {
    try {
      await setStatus(id, next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível alterar a situação.");
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Building2 size={15} /> PLATAFORMA
          </div>
          <h1>Clientes</h1>
          <p>Clínicas e profissionais autônomos que usam o sistema.</p>
        </div>
        <div className="heading-actions">
          <Button onClick={() => setShowForm((v) => !v)}>Novo cliente</Button>
        </div>
      </div>
      <div className="demo-note">
        Este painel não mostra dados de alunos nem de pacientes: o operador da plataforma só
        administra os clientes.
      </div>
      <div className="stats-grid" aria-busy={isLoading}>
        <article className="stat-card">
          <div className="stat-top">
            <span>Clínicas</span>
          </div>
          <div className="stat-value">
            {isLoading ? "—" : String(summary.clinics).padStart(2, "0")}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Autônomos</span>
          </div>
          <div className="stat-value">
            {isLoading ? "—" : String(summary.independents).padStart(2, "0")}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Ativos</span>
          </div>
          <div className="stat-value">
            {isLoading ? "—" : String(summary.active).padStart(2, "0")}
          </div>
          <div className="stat-foot">{summary.suspended} suspenso(s)</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Vagas contratadas</span>
          </div>
          <div className="stat-value">
            {isLoading ? "—" : String(summary.seats).padStart(2, "0")}
          </div>
          <div className="stat-foot">Sem contar suspensos</div>
        </article>
      </div>
      {notice ? (
        <div className="demo-note" role="status">
          {notice}
        </div>
      ) : null}
      {showForm ? (
        <form className="form-section agenda-form" onSubmit={(e) => void onSubmit(e)}>
          <h2>Novo cliente</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Tipo</label>
              <Select
                value={form.kind}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    kind: v as TenantKind,
                    document: "",
                    seats: v === "autonomo" ? "1" : "5",
                  })
                }
              >
                <SelectTrigger className="bg-card" aria-label="Tipo de cliente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tenantKindLabels) as TenantKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {tenantKindLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <label htmlFor="t-name">
                {independent ? "Nome do profissional" : "Nome da clínica"}
              </label>
              <Input
                id="t-name"
                value={form.name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="t-doc">{independent ? "CPF" : "CNPJ"}</label>
              <Input
                id="t-doc"
                inputMode="numeric"
                value={form.document}
                maxLength={18}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
            </div>
            {independent ? (
              <div className="form-field">
                <label htmlFor="t-reg">Registro profissional</label>
                <Input
                  id="t-reg"
                  placeholder="Ex.: CRP 06/000000"
                  value={form.registration}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, registration: e.target.value })}
                />
              </div>
            ) : (
              <div className="form-field">
                <label htmlFor="t-seats">Vagas (administrador + terapeutas)</label>
                <Input
                  id="t-seats"
                  type="number"
                  min={formTier?.minSeats ?? 1}
                  max={formTier?.maxSeats ?? 200}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                />
              </div>
            )}
            <div className="form-field">
              <label>Plano</label>
              <Select
                value={form.tierId}
                onValueChange={(v) => {
                  const t = tiers.find((x) => x.id === v);
                  setForm({ ...form, tierId: v, seats: String(t?.maxSeats ?? t?.minSeats ?? 1) });
                }}
              >
                <SelectTrigger className="bg-card" aria-label="Plano">
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
              <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                <SelectTrigger className="bg-card" aria-label="Ciclo de pagamento">
                  <SelectValue placeholder="Mensal ou anual" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.durationDays} dias
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <label htmlFor="t-owner">Responsável</label>
              <Input
                id="t-owner"
                value={form.ownerName}
                maxLength={120}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="t-email">E-mail do responsável</label>
              <Input
                id="t-email"
                type="email"
                value={form.ownerEmail}
                maxLength={160}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="t-phone">Telefone</label>
              <Input
                id="t-phone"
                value={form.phone}
                maxLength={30}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar cliente</Button>
          </div>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive mb-3">
          {error}
        </p>
      ) : null}
      <TiersPanel tiers={tiers} />
      <BillingPlansPanel plans={plans} />
      <div className="filter-bar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Buscar cliente"
            placeholder="Buscar por nome, e-mail ou documento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as TenantKind | "Todos")}>
          <SelectTrigger aria-label="Filtrar por tipo" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tipos</SelectItem>
            {(Object.keys(tenantKindLabels) as TenantKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {tenantKindLabels[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus_(v as TenantStatus | "Todos")}>
          <SelectTrigger aria-label="Filtrar por situação" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as situações</SelectItem>
            {tenantStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="schedule" aria-busy={isLoading}>
        {isLoading ? <p role="status">Carregando clientes...</p> : null}
        {!isLoading && rows.length === 0 ? (
          <p className="text-muted-foreground p-4">Nenhum cliente encontrado.</p>
        ) : null}
        {(isLoading ? [] : rows).map((t) => (
          <div className="appointment" key={t.id}>
            <span className="avatar" aria-hidden="true">
              {t.kind === "clinica" ? <Building2 size={16} /> : <UserRound size={16} />}
            </span>
            <div className="appointment-info">
              <strong>{t.name}</strong>
              <small>
                {tenantKindLabels[t.kind]} · {formatDocument(t.kind, t.document)} · {t.ownerName} ·{" "}
                {t.ownerEmail} · {t.seats} {t.seats === 1 ? "vaga" : "vagas"} · desde{" "}
                {formatDate(t.createdOn)}
                {t.registration ? ` · ${t.registration}` : ""}
              </small>
              <small>
                {(() => {
                  const tier = tiers.find((x) => x.id === t.tierId);
                  const cycle = plans.find((p) => p.id === t.planId);
                  if (!tier) return t.planId ? `${planName(t.planId)} · ` : "";
                  const annual = cycle ? isAnnualCycle(cycle.durationDays) : false;
                  return `${tier.name} · ${formatBRL(tierMonthlyCents(tier, t.seats, annual))}/mês${cycle ? ` (${cycle.name})` : ""} · `;
                })()}
                <span className={`status ${validityTone[validityState(t.validUntil, today)]}`}>
                  {validityText(t.validUntil, today)}
                </span>
              </small>
            </div>
            <span className={`status ${statusTone[t.status]}`}>{t.status}</span>
            <Select
              value=""
              onValueChange={(v) => void renew(t.id, v, t.validUntil)}
            >
              <SelectTrigger aria-label={`Plano de ${t.name}`} className="filter-select w-auto">
                <SelectValue placeholder={t.planId ? "Renovar plano" : "Definir plano"} />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · +{p.durationDays} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {t.status === "Suspenso" ? (
              <Button size="sm" onClick={() => void change(t.id, "Ativo")}>
                Reativar
              </Button>
            ) : (
              <>
                {t.status === "Em implantação" ? (
                  <Button size="sm" onClick={() => void change(t.id, "Ativo")}>
                    Ativar
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => void change(t.id, "Suspenso")}>
                  Suspender
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <DemoFooter />
    </main>
  );
}
