import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/use-students";
import { useRecords } from "@/hooks/use-records";
import { recordsFor } from "@/services/record-service";
import { formatDate } from "@/services/student-service";
import { StudentAvatar, DemoFooter } from "@/components/neuro/student-ui";
import { EvolutionBadge } from "@/components/neuro/record-ui";

export const Route = createFileRoute("/prontuarios")({
  head: () => ({
    meta: [
      { title: "Prontuários | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Visão geral de anamneses e prontuários de todos os alunos.",
      },
      { property: "og:title", content: "Prontuários | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Anamnese, sessões e evolução de cada aluno em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecordsOverview,
});

function RecordsOverview() {
  const { students } = useStudents();
  const { anamneses, records } = useRecords();
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <FileText size={15} /> ANAMNESE E PRONTUÁRIOS
          </div>
          <h1>Prontuários</h1>
          <p>Histórico, queixas e evolução de cada aluno.</p>
        </div>
      </div>
      <div className="schedule">
        {students.map((s) => {
          const last = recordsFor(records, s.id)[0];
          const hasAnamnesis = anamneses.some((a) => a.studentId === s.id);
          return (
            <div className="appointment" key={s.id}>
              <StudentAvatar student={s} />
              <div className="appointment-info">
                <strong>{s.name}</strong>
                <small>
                  {last ? `Última sessão em ${formatDate(last.date)}` : "Sem sessões registradas"}
                </small>
              </div>
              {last ? <EvolutionBadge value={last.evolution} /> : null}
              <span className={`status ${hasAnamnesis ? "" : "muted"}`}>
                {hasAnamnesis ? "Anamnese feita" : "Sem anamnese"}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/alunos/$id/anamnese" params={{ id: s.id }}>
                  Anamnese
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/alunos/$id/prontuario" params={{ id: s.id }}>
                  Prontuário
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
      <DemoFooter />
    </main>
  );
}
