import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
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
import { useRecords } from "@/hooks/use-records";
import { evolutionSummary, recordsFor } from "@/services/record-service";
import { formatDate } from "@/services/student-service";
import { demoDate } from "@/data/demo-students";
import {
  evolutions,
  specialties,
  type Evolution,
  type RecordDraft,
  type Specialty,
} from "@/types/record";
import { BackToProfile, EvolutionBadge, Field, TextField } from "@/components/neuro/record-ui";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/alunos/$id_/prontuario")({
  head: () => ({
    meta: [
      { title: "Prontuário e evolução | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Registros de sessões e linha do tempo de evolução do aluno.",
      },
      { property: "og:title", content: "Prontuário e evolução | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Acompanhe cada sessão e a evolução ao longo do tempo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecordPage,
});

function RecordPage() {
  const { id } = Route.useParams();
  const { students, isLoading: studentsLoading } = useStudents();
  const { records, isLoading: recordsLoading, addRecord } = useRecords();
  const student = students.find((s) => s.id === id);
  const list = recordsFor(records, id);
  const summary = evolutionSummary(list);
  const empty: RecordDraft = {
    studentId: id,
    date: demoDate,
    specialty: "Neuropsicopedagogia",
    objectives: "",
    activities: "",
    observations: "",
    evolution: "Estável",
    nextSteps: "",
  };
  const [draft, setDraft] = useState<RecordDraft>(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  if (studentsLoading || recordsLoading)
    return (
      <main className="page" aria-busy="true">
        <p role="status">Carregando prontuário...</p>
      </main>
    );
  if (!student)
    return (
      <main className="page">
        <p>Aluno não encontrado.</p>
      </main>
    );
  const set = (k: keyof RecordDraft) => (v: string) => setDraft({ ...draft, [k]: v });

  return (
    <main className="page">
      <BackToProfile id={id} />
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <FileText size={15} /> PRONTUÁRIO E EVOLUÇÃO
          </div>
          <h1>{student.name}</h1>
          <p>Cada sessão registrada compõe a história desta jornada.</p>
        </div>
        <div className="heading-actions">
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus /> Registrar sessão
          </Button>
        </div>
      </div>
      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span>Sessões registradas</span>
          </div>
          <div className="stat-value">{String(summary.total).padStart(2, "0")}</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Com avanço</span>
          </div>
          <div className="stat-value">{String(summary.advanced).padStart(2, "0")}</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Precisam de atenção</span>
          </div>
          <div className="stat-value">{String(summary.attention).padStart(2, "0")}</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Último registro</span>
          </div>
          <div className="stat-value text-2xl">{list[0] ? formatDate(list[0].date) : "—"}</div>
        </article>
      </div>

      {open ? (
        <form
          className="form-section agenda-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await addRecord(draft);
              setDraft(empty);
              setOpen(false);
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Não foi possível registrar.");
            }
          }}
        >
          <h2>Nova sessão</h2>
          <div className="form-grid">
            <Field label="Data">
              <Input
                type="date"
                aria-label="Data da sessão"
                max={demoDate}
                value={draft.date}
                onChange={(e) => set("date")(e.target.value)}
              />
            </Field>
            <Field label="Especialidade">
              <Select
                value={draft.specialty}
                onValueChange={(v) => setDraft({ ...draft, specialty: v as Specialty })}
              >
                <SelectTrigger className="bg-card" aria-label="Especialidade">
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
            </Field>
            <TextField
              id="rg-obj"
              label="Objetivos da sessão"
              required
              value={draft.objectives}
              onChange={set("objectives")}
            />
            <TextField
              id="rg-act"
              label="Atividades realizadas"
              value={draft.activities}
              onChange={set("activities")}
            />
            <TextField
              id="rg-obs"
              label="Observações"
              required
              value={draft.observations}
              onChange={set("observations")}
            />
            <Field label="Evolução">
              <Select
                value={draft.evolution}
                onValueChange={(v) => setDraft({ ...draft, evolution: v as Evolution })}
              >
                <SelectTrigger className="bg-card" aria-label="Evolução">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {evolutions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <TextField
              id="rg-next"
              label="Próximos passos"
              value={draft.nextSteps}
              onChange={set("nextSteps")}
            />
          </div>
          {error ? (
            <p className="ai-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar registro</Button>
          </div>
        </form>
      ) : null}

      <section>
        <div className="section-heading">
          <div>
            <h2>Linha do tempo</h2>
            <p>Mais recentes primeiro</p>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sessão registrada.</p>
        ) : null}
        <ol className="timeline">
          {list.map((r) => (
            <li key={r.id} className="timeline-item">
              <div className="timeline-head">
                <strong>{formatDate(r.date)}</strong>
                <span className="text-muted-foreground text-sm">{r.specialty}</span>
                <EvolutionBadge value={r.evolution} />
              </div>
              <dl className="details">
                <div>
                  <dt>Objetivos</dt>
                  <dd>{r.objectives}</dd>
                </div>
                {r.activities ? (
                  <div>
                    <dt>Atividades</dt>
                    <dd>{r.activities}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Observações</dt>
                  <dd>{r.observations}</dd>
                </div>
                {r.nextSteps ? (
                  <div>
                    <dt>Próximos passos</dt>
                    <dd>{r.nextSteps}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ol>
      </section>
      <DemoFooter />
    </main>
  );
}
