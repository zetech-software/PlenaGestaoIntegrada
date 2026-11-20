import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  UserRound,
  School,
  Users,
  Info,
  CheckCircle2,
  ClipboardList,
  Printer,
  Sprout,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/use-students";
import { StudentAvatar, StatusBadge, DemoFooter } from "@/components/neuro/student-ui";
import { formatDate, studentAge } from "@/services/student-service";
import { ActivitySuggestions } from "@/components/neuro/activity-suggestions";
export const Route = createFileRoute("/alunos/$id")({
  validateSearch: (search: Record<string, unknown>): { created?: boolean } =>
    search["created"] === true ? { created: true } : {},
  head: () => ({
    meta: [
      { title: "Perfil do aluno | Plena Gestão Integrada" },
      {
        name: "description",
        content:
          "Perfil cadastral demonstrativo com informações do aluno, escola e responsável na Plena Gestão Integrada.",
      },
      { property: "og:title", content: "Perfil do aluno | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Informações cadastrais fictícias, organizadas em um único perfil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentProfile,
});
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Não informado"}</dd>
    </div>
  );
}
function StudentProfile() {
  const { id } = Route.useParams();
  const { created } = Route.useSearch();
  const { students, isLoading } = useStudents();
  const student = students.find((item) => item.id === id);
  if (isLoading)
    return (
      <main className="page" aria-busy="true">
        <p role="status">Carregando aluno...</p>
      </main>
    );
  if (!student)
    return (
      <main className="page">
        <div className="empty-state">
          <UserRound />
          <h1>Aluno não encontrado</h1>
          <p className="my-4">Os cadastros temporários deixam de existir ao recarregar a página.</p>
          <Button asChild>
            <Link to="/alunos">Voltar para alunos</Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="page">
      <Link to="/alunos" className="back-link">
        <ArrowLeft size={14} /> Voltar para alunos
      </Link>
      {created && (
        <div className="demo-note">
          <CheckCircle2 />
          Aluno cadastrado nesta demonstração. As informações não serão armazenadas permanentemente.
        </div>
      )}
      <div className="print-header" aria-hidden="true">
        <span className="brand-symbol">
          <Sprout size={22} strokeWidth={1.7} />
        </span>
        <div>
          <strong>Plena Gestão Integrada</strong>
          <small>Ficha cadastral do aluno · por Ze Tech</small>
        </div>
        <span className="print-date">
          Emitida em {formatDate(new Date().toISOString().slice(0, 10))}
        </span>
      </div>
      <div className="page-heading">
        <div className="profile-heading">
          <StudentAvatar student={student} />
          <div>
            <h1>{student.name}</h1>
            <div className="profile-meta">
              <span>{studentAge(student.birthDate)} anos</span>
              <span>·</span>
              <span>{student.grade || "Série não informada"}</span>
              <StatusBadge status={student.status} />
            </div>
          </div>
        </div>
        <div className="heading-actions no-print">
          <Button variant="outline" asChild>
            <Link to="/alunos/$id/anamnese" params={{ id: student.id }}>
              <ClipboardList /> Anamnese
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/alunos/$id/prontuario" params={{ id: student.id }}>
              <FileText /> Prontuário
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Baixar ficha em PDF
          </Button>
        </div>
      </div>
      <div className="profile-grid">
        <section className="detail-section">
          <h2>
            <UserRound /> Dados do aluno
          </h2>
          <dl className="details">
            <Detail label="Nome completo" value={student.name} />
            <Detail label="Data de nascimento" value={formatDate(student.birthDate)} />
            <Detail label="Idade na demonstração" value={`${studentAge(student.birthDate)} anos`} />
            <Detail label="Data de cadastro" value={formatDate(student.startDate)} />
          </dl>
        </section>
        <section className="detail-section">
          <h2>
            <School /> Informações escolares
          </h2>
          <dl className="details">
            <Detail label="Escola" value={student.school} />
            <Detail label="Série / Ano" value={student.grade} />
          </dl>
        </section>
        <section className="detail-section">
          <h2>
            <Users /> Responsável e contato
          </h2>
          <dl className="details">
            <Detail label="Nome do responsável" value={student.guardian} />
            <Detail label="Parentesco" value={student.relationship} />
            <Detail label="Telefone" value={student.phone} />
            <Detail label="E-mail" value={student.email} />
          </dl>
        </section>
        <section className="detail-section">
          <h2>
            <ClipboardList /> Observações cadastrais
          </h2>
          <p className="profile-note">{student.notes || "Nenhuma observação cadastral."}</p>
        </section>
      </div>
      <ActivitySuggestions student={student} />
      <p className="print-footer">
        Plena Gestão Integrada · Documento demonstrativo com dados fictícios.
      </p>
      <div className="demo-note mt-6 no-print">
        <Info />
        Perfil cadastral demonstrativo. Anamnese e prontuário ficam nos botões acima. Os registros são demonstrativos e não ficam guardados.
      </div>
      <DemoFooter />
    </main>
  );
}
