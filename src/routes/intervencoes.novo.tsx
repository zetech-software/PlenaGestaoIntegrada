import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { usePlans } from "@/hooks/use-plans";
import { MAX_GOALS } from "@/services/plan-service";
import { demoDate } from "@/data/demo-students";
import {
  planKinds,
  planKindLabels,
  planStatuses,
  type GoalDraft,
  type PlanKind,
  type PlanStatus,
} from "@/types/plan";
import { specialties, type Specialty } from "@/types/record";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/intervencoes/novo")({
  head: () => ({
    meta: [
      { title: "Novo plano | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Cadastro demonstrativo de plano de intervenção PEI ou PTI com metas e prazos.",
      },
      { property: "og:title", content: "Novo plano | Plena Gestão Integrada" },
      { property: "og:description", content: "Defina metas, estratégias e prazos para o aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewPlan,
});

const emptyGoal = (): GoalDraft => ({ description: "", strategy: "", deadline: "" });

function NewPlan() {
  const { students } = useStudents();
  const { addPlan } = usePlans();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [kind, setKind] = useState<PlanKind>("PTI");
  const [status, setStatus] = useState<PlanStatus>("Ativo");
  const [specialty, setSpecialty] = useState<Specialty>("Neuropsicopedagogia");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(demoDate);
  const [reviewDate, setReviewDate] = useState("");
  const [summary, setSummary] = useState("");
  const [goals, setGoals] = useState<GoalDraft[]>([emptyGoal()]);
  const [error, setError] = useState("");

  function patchGoal(index: number, patch: Partial<GoalDraft>) {
    setGoals((current) => current.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const plan = addPlan({
        studentId,
        kind,
        status,
        specialty,
        title,
        startDate,
        reviewDate,
        summary,
        goals,
      });
      await navigate({
        to: "/intervencoes/$id",
        params: { id: plan.id },
        search: { created: true },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o plano.");
    }
  }

  return (
    <main className="page">
      <Link to="/intervencoes" className="back-link">
        <ArrowLeft size={14} /> Voltar para intervenções
      </Link>
      <div className="page-heading">
        <div>
          <h1>Novo plano de intervenção</h1>
          <p>Defina metas claras, estratégias e prazos.</p>
        </div>
      </div>
      <form onSubmit={(e) => void onSubmit(e)}>
        <section className="form-section">
          <h2>Dados do plano</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="plan-student">
                Aluno <span className="text-primary">*</span>
              </label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="plan-student" className="bg-card">
                  <SelectValue placeholder="Escolha o aluno" />
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
              <label htmlFor="plan-kind">Tipo</label>
              <Select value={kind} onValueChange={(v) => setKind(v as PlanKind)}>
                <SelectTrigger id="plan-kind" className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planKinds.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k} · {planKindLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <label htmlFor="plan-title">
                Título <span className="text-primary">*</span>
              </label>
              <Input
                id="plan-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="plan-specialty">Área</label>
              <Select value={specialty} onValueChange={(v) => setSpecialty(v as Specialty)}>
                <SelectTrigger id="plan-specialty" className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <label htmlFor="plan-start">
                Início <span className="text-primary">*</span>
              </label>
              <Input
                id="plan-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="plan-review">
                Revisão <span className="text-primary">*</span>
              </label>
              <Input
                id="plan-review"
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="plan-status">Situação</label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger id="plan-status" className="bg-card">
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
            </div>
            <div className="form-field full">
              <label htmlFor="plan-summary">
                Resumo <span className="text-primary">*</span>
              </label>
              <Textarea
                id="plan-summary"
                className="bg-card"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
          </div>
        </section>
        <section className="form-section">
          <h2>Metas</h2>
          <p>Cada meta precisa de descrição e prazo entre o início e a revisão.</p>
          {goals.map((goal, index) => (
            <fieldset className="goal-fieldset" key={index}>
              <legend>Meta {index + 1}</legend>
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor={`goal-${index}-d`}>
                    Descrição <span className="text-primary">*</span>
                  </label>
                  <Textarea
                    id={`goal-${index}-d`}
                    className="bg-card"
                    rows={2}
                    value={goal.description}
                    onChange={(e) => patchGoal(index, { description: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`goal-${index}-s`}>Estratégia</label>
                  <Input
                    id={`goal-${index}-s`}
                    value={goal.strategy}
                    maxLength={200}
                    onChange={(e) => patchGoal(index, { strategy: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`goal-${index}-p`}>
                    Prazo <span className="text-primary">*</span>
                  </label>
                  <Input
                    id={`goal-${index}-p`}
                    type="date"
                    value={goal.deadline}
                    onChange={(e) => patchGoal(index, { deadline: e.target.value })}
                  />
                </div>
              </div>
              {goals.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGoals((c) => c.filter((_, i) => i !== index))}
                >
                  <Trash2 /> Remover meta
                </Button>
              ) : null}
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={goals.length >= MAX_GOALS}
            onClick={() => setGoals((c) => [...c, emptyGoal()])}
          >
            <Plus /> Adicionar meta
          </Button>
        </section>
        {error ? (
          <p role="alert" className="text-sm text-destructive mb-3">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <Button variant="outline" asChild>
            <Link to="/intervencoes">Cancelar</Link>
          </Button>
          <Button type="submit">
            <Check /> Salvar plano
          </Button>
        </div>
      </form>
      <DemoFooter />
    </main>
  );
}
