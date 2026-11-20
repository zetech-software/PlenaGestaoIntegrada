import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { useRecords } from "@/hooks/use-records";
import { specialties, type AnamnesisDraft, type Specialty } from "@/types/record";
import { formatDate } from "@/services/student-service";
import { BackToProfile, Field, TextField } from "@/components/neuro/record-ui";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/alunos/$id_/anamnese")({
  head: () => ({
    meta: [
      { title: "Anamnese multidisciplinar | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Registro de histórico, queixa principal e contexto familiar e escolar do aluno.",
      },
      { property: "og:title", content: "Anamnese multidisciplinar | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Histórico e queixas organizados para todas as especialidades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnamnesisPage,
});

const sections: { key: keyof AnamnesisDraft; label: string; hint: string; required?: boolean }[] = [
  {
    key: "mainComplaint",
    label: "Queixa principal",
    hint: "O que motivou a procura, nas palavras da família ou escola",
    required: true,
  },
  {
    key: "referral",
    label: "Encaminhamento",
    hint: "Quem encaminhou: escola, família, outro profissional",
  },
  { key: "gestation", label: "Gestação e nascimento", hint: "Informações relatadas pela família" },
  { key: "development", label: "Desenvolvimento", hint: "Marcos motores, fala, sono, alimentação" },
  { key: "health", label: "Saúde", hint: "Acompanhamentos, medicações relatadas" },
  { key: "family", label: "Contexto familiar", hint: "Com quem mora, rotina, dinâmica" },
  { key: "school", label: "Histórico escolar", hint: "Adaptação, desempenho, relação com colegas" },
  { key: "expectations", label: "Expectativas", hint: "O que a família espera do acompanhamento" },
];

function AnamnesisPage() {
  const { isLoading: studentsLoading } = useStudents();
  const { isLoading: recordsLoading } = useRecords();
  // O formulário parte da anamnese já salva, então só abre depois que os dados chegam.
  if (studentsLoading || recordsLoading)
    return (
      <main className="page" aria-busy="true">
        <p role="status">Carregando anamnese...</p>
      </main>
    );
  return <AnamnesisForm />;
}
function AnamnesisForm() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { anamneses, saveAnamnesis } = useRecords();
  const student = students.find((s) => s.id === id);
  const existing = anamneses.find((a) => a.studentId === id);
  const [draft, setDraft] = useState<AnamnesisDraft>(() => {
    if (existing) {
      const { updatedAt: _u, ...rest } = existing;
      return rest;
    }
    return {
      studentId: id,
      specialty: "Neuropsicopedagogia",
      mainComplaint: "",
      referral: "",
      gestation: "",
      development: "",
      health: "",
      family: "",
      school: "",
      expectations: "",
    };
  });
  const [error, setError] = useState("");
  if (!student)
    return (
      <main className="page">
        <p>Aluno não encontrado.</p>
      </main>
    );

  return (
    <main className="page">
      <BackToProfile id={id} />
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ClipboardList size={15} /> ANAMNESE MULTIDISCIPLINAR
          </div>
          <h1>{student.name}</h1>
          <p>
            {existing
              ? `Última atualização em ${formatDate(existing.updatedAt)}`
              : "Nenhuma anamnese registrada ainda."}
          </p>
        </div>
      </div>
      <div className="demo-note">
        <Info /> Registro de histórico relatado. Não gera diagnósticos e não é guardado
        permanentemente.
      </div>
      <form
        className="form-section"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await saveAnamnesis(draft);
            await navigate({ to: "/alunos/$id", params: { id } });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível salvar.");
          }
        }}
      >
        <div className="form-grid">
          <Field label="Especialidade responsável">
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
          {sections.map((s) => (
            <TextField
              key={s.key}
              id={`an-${s.key}`}
              label={s.label}
              hint={s.hint}
              required={s.required}
              value={String(draft[s.key])}
              onChange={(v) => setDraft({ ...draft, [s.key]: v })}
            />
          ))}
        </div>
        {error ? (
          <p className="ai-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <Button type="submit">Salvar anamnese</Button>
        </div>
      </form>
      <DemoFooter />
    </main>
  );
}
