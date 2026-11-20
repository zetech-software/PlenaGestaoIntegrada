import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { useSessions } from "@/hooks/use-sessions";
import { useRecords } from "@/hooks/use-records";
import { usePlans } from "@/hooks/use-plans";
import { useAuth } from "@/hooks/use-auth";
import { useFinance } from "@/hooks/use-finance";
import { canAccess } from "@/services/permissions";
import { formatBRL } from "@/services/finance-service";
import {
  attendanceByTherapist,
  financeReport,
  planReport,
  studentReport,
  type Period,
} from "@/services/report-service";
import { formatDate } from "@/services/student-service";
import { DemoFooter } from "@/components/neuro/student-ui";
import { PrintFooter, PrintHeader } from "@/components/neuro/print-ui";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Plena Gestão Integrada" },
      {
        name: "description",
        content:
          "Relatórios de frequência por terapeuta, acompanhamento de alunos e planos de intervenção, com exportação em PDF.",
      },
      { property: "og:title", content: "Relatórios | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Frequência, evolução e progresso dos planos em PDF com a marca Plena.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

type Kind = "frequencia" | "alunos" | "planos" | "financeiro";
const kindLabels: Record<Kind, string> = {
  frequencia: "Frequência por terapeuta",
  alunos: "Acompanhamento dos alunos",
  planos: "Planos de intervenção",
  financeiro: "Financeiro",
};
const pct = (value: number | null) => (value === null ? "—" : `${value}%`);

function ReportsPage() {
  const { students, isLoading: studentsLoading } = useStudents();
  const { sessions, isLoading: sessionsLoading } = useSessions();
  const { records, isLoading: recordsLoading } = useRecords();
  const { plans, isLoading: plansLoading } = usePlans();
  const { role } = useAuth();
  const { charges, isLoading: financeLoading } = useFinance();
  const isLoading =
    studentsLoading || sessionsLoading || recordsLoading || plansLoading || financeLoading;
  // O relatório financeiro só aparece para quem acessa o financeiro.
  const kinds = (Object.keys(kindLabels) as Kind[]).filter(
    (k) => k !== "financeiro" || canAccess(role, "financeiro"),
  );
  const [kind, setKind] = useState<Kind>("frequencia");
  const [period, setPeriod] = useState<Period>({ from: "2026-11-01", to: "2026-11-30" });
  const invalid = Boolean(period.from && period.to && period.to < period.from);
  const detail = `${period.from ? formatDate(period.from) : "início"} a ${period.to ? formatDate(period.to) : "hoje"}`;

  return (
    <main className="page">
      <PrintHeader title={kindLabels[kind]} detail={detail} />
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <FileText size={15} /> RELATÓRIOS
          </div>
          <h1>Relatórios</h1>
          <p>Números para acompanhar a equipe e cada jornada.</p>
        </div>
        <div className="heading-actions no-print">
          <Button variant="outline" disabled={invalid || isLoading} onClick={() => window.print()}>
            <Printer /> Exportar PDF
          </Button>
        </div>
      </div>
      <div className="filter-bar no-print">
        <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <SelectTrigger aria-label="Tipo de relatório" className="filter-select wide">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((k) => (
              <SelectItem key={k} value={k}>
                {kindLabels[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="period-field">
          De
          <Input
            type="date"
            value={period.from}
            onChange={(e) => setPeriod({ ...period, from: e.target.value })}
          />
        </label>
        <label className="period-field">
          Até
          <Input
            type="date"
            value={period.to}
            onChange={(e) => setPeriod({ ...period, to: e.target.value })}
          />
        </label>
      </div>
      {invalid ? (
        <p role="alert" className="text-sm text-destructive mb-3">
          A data final não pode ser anterior à inicial.
        </p>
      ) : null}
      <section className="report">
        <h2 className="report-title">
          {kindLabels[kind]} <small>· {detail}</small>
        </h2>
        {isLoading ? (
          <p role="status" aria-busy="true">
            Carregando relatório...
          </p>
        ) : (
          <>
            {kind === "frequencia" ? (
              <TherapistTable rows={attendanceByTherapist(sessions, students, period)} />
            ) : null}
            {kind === "alunos" ? (
              <StudentsTable rows={studentReport(students, sessions, records, plans, period)} />
            ) : null}
            {kind === "planos" ? <PlansTable rows={planReport(plans, students, period)} /> : null}
            {kind === "financeiro" ? (
              <FinanceTable report={financeReport(charges, students, period)} />
            ) : null}
          </>
        )}
        <p className="report-note">
          Frequência = realizadas ÷ (realizadas + faltas). Sessões canceladas e pendentes não entram
          no cálculo.
        </p>
      </section>
      <PrintFooter />
      <DemoFooter />
    </main>
  );
}

function TherapistTable({ rows }: { rows: ReturnType<typeof attendanceByTherapist> }) {
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Terapeuta</th>
          <th>Área</th>
          <th>Alunos</th>
          <th>Realizadas</th>
          <th>Faltas</th>
          <th>Pendentes</th>
          <th>Frequência</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.therapist.id}>
            <td>{r.therapist.name}</td>
            <td>{r.therapist.specialty}</td>
            <td>{r.students}</td>
            <td>{r.done}</td>
            <td>{r.missed}</td>
            <td>{r.pending}</td>
            <td>
              <strong>{pct(r.rate)}</strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function StudentsTable({ rows }: { rows: ReturnType<typeof studentReport> }) {
  if (!rows.length)
    return <p className="report-empty">Nenhum aluno disponível para este perfil.</p>;
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Terapeuta</th>
          <th>Realizadas</th>
          <th>Faltas</th>
          <th>Pendentes</th>
          <th>Frequência</th>
          <th>Última evolução</th>
          <th>Planos</th>
          <th>Progresso</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.student.id}>
            <td>{r.student.name}</td>
            <td>{r.therapist}</td>
            <td>{r.done}</td>
            <td>{r.missed}</td>
            <td>{r.pending}</td>
            <td>
              <strong>{pct(r.rate)}</strong>
            </td>
            <td>{r.lastEvolution}</td>
            <td>{r.plans}</td>
            <td>{pct(r.planProgress)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function PlansTable({ rows }: { rows: ReturnType<typeof planReport> }) {
  if (!rows.length) return <p className="report-empty">Nenhum plano vigente neste período.</p>;
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Plano</th>
          <th>Tipo</th>
          <th>Aluno</th>
          <th>Situação</th>
          <th>Revisão</th>
          <th>Metas</th>
          <th>Progresso</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ plan, studentName, progress }) => (
          <tr key={plan.id}>
            <td>{plan.title}</td>
            <td>{plan.kind}</td>
            <td>{studentName}</td>
            <td>{plan.status}</td>
            <td>{formatDate(plan.reviewDate)}</td>
            <td>{plan.goals.length}</td>
            <td>
              <strong>{progress}%</strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FinanceTable({ report }: { report: ReturnType<typeof financeReport> }) {
  if (!report.rows.length) return <p className="report-empty">Nenhuma cobrança neste período.</p>;
  return (
    <>
      <table className="report-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Descrição</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map(({ charge, studentName, status }) => (
            <tr key={charge.id}>
              <td>{studentName}</td>
              <td>{charge.description}</td>
              <td>{formatDate(charge.dueDate)}</td>
              <td>{formatBRL(charge.amountCents)}</td>
              <td>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="report-note">
        <strong>Totais:</strong> em aberto {formatBRL(report.totals.open)} · em atraso{" "}
        {formatBRL(report.totals.overdue)} · pago {formatBRL(report.totals.paid)}. Cobranças
        canceladas não entram nos totais.
      </p>
    </>
  );
}
