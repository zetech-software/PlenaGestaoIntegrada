import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudit } from "@/hooks/use-audit";
import { useFinance } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { demoDate } from "@/data/demo-students";
import {
  displayStatus,
  filterCharges,
  formatBRL,
  parseBRL,
  summarize,
} from "@/services/finance-service";
import { formatDate } from "@/services/student-service";
import { paymentMethods, type ChargeDisplayStatus, type PaymentMethod } from "@/types/finance";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | Plena Gestão Integrada" },
      { name: "description", content: "Cobranças, vencimentos e recebimentos dos alunos." },
      { property: "og:title", content: "Financeiro | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Acompanhe o que a receber, o que está em atraso e o que já foi recebido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinancePage,
});

const statuses: (ChargeDisplayStatus | "Todas")[] = [
  "Todas",
  "Em aberto",
  "Atrasado",
  "Pago",
  "Cancelado",
];
const tone: Record<ChargeDisplayStatus, string> = {
  "Em aberto": "info",
  Atrasado: "warm",
  Pago: "",
  Cancelado: "muted",
};
const monthStart = `${demoDate.slice(0, 8)}01`;
const monthEnd = `${demoDate.slice(0, 8)}31`;

function FinancePage() {
  const { students } = useStudents();
  const { log } = useAudit();
  const { charges, isLoading, create, markPaid, cancel } = useFinance();
  const [filter, setFilter] = useState<ChargeDisplayStatus | "Todas">("Todas");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [studentId, setStudentId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const summary = summarize(charges, { from: monthStart, to: monthEnd });
  const rows = filterCharges(charges, filter);

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return false;
    }
  }
  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const cents = parseBRL(amount);
    if (cents === null) return setError("Informe um valor válido, como 150,00.");
    const ok = await run(() => create({ studentId, description, amountCents: cents, dueDate }));
    if (ok) {
      log("criou", "cobranca", studentId, `${description.trim()} · ${formatBRL(cents)}`);
      setDescription("");
      setAmount("");
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Wallet size={15} /> FINANCEIRO
          </div>
          <h1>Financeiro</h1>
          <p>Cobranças, vencimentos e recebimentos.</p>
        </div>
      </div>
      <div className="demo-note">
        Este módulo só registra cobranças e baixas feitas por fora. Ele não processa pagamentos.
      </div>
      <div className="stats-grid three" aria-busy={isLoading}>
        <article className="stat-card">
          <div className="stat-top">
            <span>A receber</span>
          </div>
          <div className="stat-value text-2xl">
            {isLoading ? "—" : formatBRL(summary.toReceive)}
          </div>
          <div className="stat-foot">Em aberto, no prazo</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Em atraso</span>
          </div>
          <div className="stat-value text-2xl">{isLoading ? "—" : formatBRL(summary.overdue)}</div>
          <div className="stat-foot">Vencidas e não pagas</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Recebido no mês</span>
          </div>
          <div className="stat-value text-2xl">{isLoading ? "—" : formatBRL(summary.received)}</div>
          <div className="stat-foot">Baixas de novembro</div>
        </article>
      </div>
      <form className="form-section agenda-form" onSubmit={(e) => void onCreate(e)}>
        <h2>Nova cobrança</h2>
        <div className="form-grid">
          <div className="form-field">
            <label>Aluno</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="bg-card" aria-label="Aluno da cobrança">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="form-field">
            <label htmlFor="fin-desc">Descrição</label>
            <Input
              id="fin-desc"
              value={description}
              maxLength={120}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="fin-amount">Valor (R$)</label>
            <Input
              id="fin-amount"
              inputMode="decimal"
              placeholder="150,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="fin-due">Vencimento</label>
            <Input
              id="fin-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" className="mt-3">
          Criar cobrança
        </Button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive mb-3">
          {error}
        </p>
      ) : null}
      <div className="filter-bar">
        <Select value={filter} onValueChange={(v) => setFilter(v as ChargeDisplayStatus | "Todas")}>
          <SelectTrigger aria-label="Filtrar por situação" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "Todas" ? "Todas as situações" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <SelectTrigger aria-label="Forma de pagamento da baixa" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => (
              <SelectItem key={m} value={m}>
                Baixa por {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="schedule" aria-busy={isLoading}>
        {isLoading ? <p role="status">Carregando cobranças...</p> : null}
        {!isLoading && rows.length === 0 ? (
          <p className="text-muted-foreground p-4">Nenhuma cobrança nesta situação.</p>
        ) : null}
        {(isLoading ? [] : rows).map((charge) => {
          const status = displayStatus(charge);
          return (
            <div className="appointment" key={charge.id}>
              <div className="appointment-info">
                <strong>{nameOf(charge.studentId)}</strong>
                <small>
                  {charge.description} · vence {formatDate(charge.dueDate)}
                  {charge.paidOn
                    ? ` · pago em ${formatDate(charge.paidOn)} (${charge.method})`
                    : ""}
                </small>
              </div>
              <strong>{formatBRL(charge.amountCents)}</strong>
              <span className={`status ${tone[status]}`}>{status}</span>
              {charge.status === "Em aberto" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      void run(async () => {
                        await markPaid(charge.id, method);
                        log("editou", "cobranca", charge.studentId, `baixa · ${method}`);
                      })
                    }
                  >
                    Registrar pagamento
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void run(async () => {
                        await cancel(charge.id);
                        log("editou", "cobranca", charge.studentId, "cancelada");
                      })
                    }
                  >
                    Cancelar
                  </Button>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <DemoFooter />
    </main>
  );
}
