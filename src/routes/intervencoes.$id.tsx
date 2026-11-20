import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Printer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditView } from "@/hooks/use-audit";
import { useStudents } from "@/hooks/use-students";
import { usePlans } from "@/hooks/use-plans";
import { isReviewOverdue, planProgress } from "@/services/plan-service";
import { formatDate } from "@/services/student-service";
import { planKindLabels, planStatuses, type PlanStatus } from "@/types/plan";
import { DemoFooter } from "@/components/neuro/student-ui";
import { PrintFooter, PrintHeader } from "@/components/neuro/print-ui";

export const Route = createFileRoute("/intervencoes/$id")({
  validateSearch: (search: Record<string, unknown>): { created?: boolean } =>
    search["created"] === true || search["created"] === "true" ? { created: true } : {},
  head: () => ({
    meta: [
      { title: "Plano de intervenção | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Metas, estratégias e progresso do plano de intervenção do aluno.",
      },
      { property: "og:title", content: "Plano de intervenção | Plena Gestão Integrada" },
      { property: "og:description", content: "Acompanhe o progresso de cada meta do plano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanDetail,
});

function PlanDetail() {
  const { id } = Route.useParams();
  const { created } = Route.useSearch();
  const { students } = useStudents();
  const { plans, isLoading, setStatus, setGoalProgress } = usePlans();
  const [error, setError] = useState("");
  async function update(action: () => Promise<void>) {
    try {
      await action();
      setError("");
    } catch {
      setError("Não foi possível salvar a alteração. Tente novamente.");
    }
  }
  const plan = plans.find((p) => p.id === id);
  useAuditView("plano", plan?.studentId ?? "", plan !== undefined);
  if (isLoading)
    return (
      <main className="page" aria-busy="true">
        <p role="status">Carregando plano...</p>
      </main>
    );
  if (!plan)
    return (
      <main className="page">
        <div className="empty-state">
          <Target />
          <h1>Plano não encontrado</h1>
          <p className="my-4">
            Os planos cadastrados nesta demonstração deixam de existir ao recarregar a página.
          </p>
          <Button asChild>
            <Link to="/intervencoes">Voltar para intervenções</Link>
          </Button>
        </div>
      </main>
    );
  const student = students.find((s) => s.id === plan.studentId);
  const progress = planProgress(plan);
  return (
    <main className="page">
      <Link to="/intervencoes" className="back-link">
        <ArrowLeft size={14} /> Voltar para intervenções
      </Link>
      {created ? (
        <div className="demo-note no-print">
          <CheckCircle2 /> Plano cadastrado nesta demonstração. Ele não será armazenado
          permanentemente.
        </div>
      ) : null}
      <PrintHeader title={`${plan.kind} · ${planKindLabels[plan.kind]}`} detail={student?.name} />
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Target size={15} /> {plan.kind} · {planKindLabels[plan.kind].toUpperCase()}
          </div>
          <h1>{plan.title}</h1>
          <p>
            {student?.name ?? "—"} · {plan.specialty}
          </p>
        </div>
        <div className="heading-actions no-print">
          <Select
            value={plan.status}
            onValueChange={(v) => void update(() => setStatus(plan.id, v as PlanStatus))}
          >
            <SelectTrigger aria-label="Situação do plano" className="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Exportar PDF
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive no-print mb-3">
          {error}
        </p>
      ) : null}
      <section className="detail-section">
        <h2>Resumo</h2>
        <p className="profile-note">{plan.summary}</p>
        <dl className="plan-facts">
          <div>
            <dt>Situação</dt>
            <dd>{plan.status}</dd>
          </div>
          <div>
            <dt>Início</dt>
            <dd>{formatDate(plan.startDate)}</dd>
          </div>
          <div>
            <dt>Revisão</dt>
            <dd>
              {formatDate(plan.reviewDate)}
              {isReviewOverdue(plan) ? " (vencida)" : ""}
            </dd>
          </div>
          <div>
            <dt>Progresso geral</dt>
            <dd>{progress}%</dd>
          </div>
        </dl>
        <Progress value={progress} aria-label={`Progresso geral de ${progress}%`} />
      </section>
      <section className="detail-section">
        <h2>Metas</h2>
        <ol className="goal-list">
          {plan.goals.map((goal) => (
            <li key={goal.id} className="goal-item">
              <strong>{goal.description}</strong>
              <small>
                Estratégia: {goal.strategy || "Não informada"} · Prazo: {formatDate(goal.deadline)}
              </small>
              <div className="goal-progress">
                <Progress value={goal.progress} />
                <span>{goal.progress}%</span>
                <input
                  className="no-print"
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={goal.progress}
                  aria-label={`Progresso da meta: ${goal.description}`}
                  onChange={(e) =>
                    void update(() => setGoalProgress(plan.id, goal.id, Number(e.target.value)))
                  }
                />
              </div>
            </li>
          ))}
        </ol>
      </section>
      <PrintFooter />
      <DemoFooter />
    </main>
  );
}
