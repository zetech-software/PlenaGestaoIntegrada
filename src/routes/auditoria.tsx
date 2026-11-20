import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudit } from "@/hooks/use-audit";
import { useStudents } from "@/hooks/use-students";
import { filterAudit } from "@/services/audit-service";
import { auditActions, type AuditAction } from "@/types/audit";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Registro de quem acessou, criou, editou ou exportou dados de alunos.",
      },
      { property: "og:title", content: "Auditoria | Plena Gestão Integrada" },
      { property: "og:description", content: "Rastreabilidade do acesso a dados de alunos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

const resourceLabel: Record<string, string> = { prontuario: "prontuário" };
const time = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

function AuditPage() {
  const { events, isLoading } = useAudit();
  const { students } = useStudents();
  const [action, setAction] = useState<AuditAction | "Todas">("Todas");
  const [studentId, setStudentId] = useState("");
  const rows = filterAudit(events, { action, studentId });
  const nameOf = (id: string | null) => students.find((s) => s.id === id)?.name ?? "—";
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ScrollText size={15} /> AUDITORIA
          </div>
          <h1>Auditoria de acesso</h1>
          <p>Quem abriu, criou, editou ou exportou dados de alunos, e quando.</p>
        </div>
      </div>
      <div className="filter-bar">
        <Select value={action} onValueChange={(v) => setAction(v as AuditAction | "Todas")}>
          <SelectTrigger aria-label="Filtrar por ação" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as ações</SelectItem>
            {auditActions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={studentId || "todos"}
          onValueChange={(v) => setStudentId(v === "todos" ? "" : v)}
        >
          <SelectTrigger aria-label="Filtrar por aluno" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os alunos</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <section className="report">
        {isLoading ? (
          <p role="status" aria-busy="true">
            Carregando registro...
          </p>
        ) : rows.length === 0 ? (
          <p className="report-empty">
            Nenhum evento registrado nesta sessão. Abra o perfil, a anamnese ou o prontuário de um
            aluno para gerar eventos.
          </p>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Aluno</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{time.format(new Date(e.at))}</td>
                  <td>{e.userEmail}</td>
                  <td>{e.role}</td>
                  <td>
                    <strong>{e.action}</strong>
                  </td>
                  <td>{resourceLabel[e.resource] ?? e.resource}</td>
                  <td>{nameOf(e.studentId)}</td>
                  <td>{e.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="report-note">
          O registro é só de inclusão e, nesta demonstração, fica em memória. Com banco de dados,
          ele passa a ser permanente e só administradores o leem.
        </p>
      </section>
      <DemoFooter />
    </main>
  );
}
