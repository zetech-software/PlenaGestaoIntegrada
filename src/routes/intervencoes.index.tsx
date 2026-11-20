import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { usePlans } from "@/hooks/use-plans";
import { filterPlans, isReviewOverdue, planProgress } from "@/services/plan-service";
import { formatDate } from "@/services/student-service";
import { planKinds, planStatuses, type PlanKind, type PlanStatus } from "@/types/plan";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/intervencoes/")({
  head: () => ({
    meta: [
      { title: "Intervenções | Plena Gestão Integrada" },
      {
        name: "description",
        content:
          "Planos de intervenção PEI e PTI com metas, estratégias e acompanhamento do progresso.",
      },
      { property: "og:title", content: "Intervenções | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Planos educacionais e terapêuticos individualizados em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlansPage,
});

const statusTone: Record<PlanStatus, string> = { Rascunho: "muted", Ativo: "", Concluído: "info" };

function PlansPage() {
  const { students } = useStudents();
  const { plans } = usePlans();
  const [kind, setKind] = useState<PlanKind | "Todos">("Todos");
  const [status, setStatus] = useState<PlanStatus | "Todos">("Todos");
  const filtered = filterPlans(plans, kind, status);
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Target size={15} /> PEI E PTI
          </div>
          <h1>Intervenções</h1>
          <p>Metas, estratégias e progresso de cada aluno.</p>
        </div>
        <Button asChild>
          <Link to="/intervencoes/novo">
            <Plus /> Novo plano
          </Link>
        </Button>
      </div>
      <div className="filter-bar">
        <Select value={kind} onValueChange={(v) => setKind(v as PlanKind | "Todos")}>
          <SelectTrigger aria-label="Filtrar por tipo de plano" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tipos</SelectItem>
            {planKinds.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus | "Todos")}>
          <SelectTrigger aria-label="Filtrar por situação" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as situações</SelectItem>
            {planStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="table-wrap empty-state">
          <Target size={30} />
          <h2>Nenhum plano encontrado</h2>
          <p className="mt-2 text-xs">Ajuste os filtros ou crie um novo plano.</p>
        </div>
      ) : (
        <div className="schedule">
          {filtered.map((plan) => {
            const student = students.find((s) => s.id === plan.studentId);
            const progress = planProgress(plan);
            return (
              <div className="appointment plan-row" key={plan.id}>
                <span className="status info">{plan.kind}</span>
                <div className="appointment-info">
                  <Link to="/intervencoes/$id" params={{ id: plan.id }}>
                    <strong>{plan.title}</strong>
                  </Link>
                  <small>
                    {student?.name ?? "—"} · {plan.specialty} · revisão em{" "}
                    {formatDate(plan.reviewDate)}
                  </small>
                </div>
                <div className="plan-progress" aria-label={`Progresso de ${progress}%`}>
                  <Progress value={progress} />
                  <small>{progress}%</small>
                </div>
                {isReviewOverdue(plan) ? (
                  <span className="status warm">Revisão vencida</span>
                ) : null}
                <span className={`status ${statusTone[plan.status]}`}>{plan.status}</span>
              </div>
            );
          })}
        </div>
      )}
      <DemoFooter />
    </main>
  );
}
