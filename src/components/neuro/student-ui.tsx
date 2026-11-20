import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initials, studentAge } from "@/services/student-service";
import type { Student, StudentStatus } from "@/types/student";
export function StudentAvatar({ student }: { student: Student }) {
  return (
    <span className={`avatar ${student.tone}`} aria-hidden="true">
      {initials(student.name)}
    </span>
  );
}
export function StatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={`status ${status === "Em avaliação" ? "warm" : status === "Inativo" ? "muted" : ""}`}
    >
      {status}
    </span>
  );
}
export function StudentTable({ students }: { students: Student[] }) {
  if (!students.length)
    return (
      <div className="table-wrap empty-state">
        <Users size={30} />
        <h2>Nenhum aluno encontrado</h2>
        <p className="mt-2 text-xs">Não há alunos correspondentes aos filtros selecionados.</p>
      </div>
    );
  return (
    <div className="table-wrap">
      <table className="students-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Escola / Série</th>
            <th>Responsável</th>
            <th>Status</th>
            <th aria-label="Ver perfil" />
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>
                <Link to="/alunos/$id" params={{ id: student.id }} className="student-name">
                  <StudentAvatar student={student} />
                  <span>
                    <strong>{student.name}</strong>
                    <small>{studentAge(student.birthDate)} anos</small>
                  </span>
                </Link>
              </td>
              <td>
                <span className="block">{student.school}</span>
                <span className="mt-1 block text-muted-foreground">{student.grade}</span>
              </td>
              <td>{student.guardian}</td>
              <td>
                <StatusBadge status={student.status} />
              </td>
              <td>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    to="/alunos/$id"
                    params={{ id: student.id }}
                    aria-label={`Ver perfil de ${student.name}`}
                    title="Ver perfil"
                  >
                    <ArrowUpRight />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function DemoFooter() {
  return (
    <footer className="page-footer">
      <span>Ze Tech Neuro · Cuidado em cada etapa.</span>
      <span>Ambiente demonstrativo · Todos os dados são fictícios</span>
    </footer>
  );
}
