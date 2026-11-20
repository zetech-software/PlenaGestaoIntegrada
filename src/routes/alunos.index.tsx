import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { filterStudents } from "@/services/student-service";
import { StudentTable, DemoFooter } from "@/components/neuro/student-ui";
export const Route = createFileRoute("/alunos/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Alunos | Ze Tech Neuro" },
      {
        name: "description",
        content:
          "Listagem demonstrativa de alunos da Ze Tech Neuro, com busca e filtros por escola e status.",
      },
      { property: "og:title", content: "Alunos | Ze Tech Neuro" },
      {
        property: "og:description",
        content: "Conheça os cadastros fictícios da demonstração neuropsicopedagógica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentsPage,
});
function StudentsPage() {
  const { students } = useStudents();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [status, setStatus] = useState("Todos");
  const [school, setSchool] = useState("Todas");
  const filtered = filterStudents(students, search.q ?? "", status, school);
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Users size={15} /> CADA ALUNO, UMA JORNADA
          </div>
          <h1>Alunos</h1>
          <p>Um olhar próximo para quem faz parte do seu cuidado.</p>
        </div>
        <Button asChild>
          <Link to="/alunos/novo">
            <Plus /> Novo aluno
          </Link>
        </Button>
      </div>
      <div className="filter-bar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Buscar alunos"
            placeholder="Buscar por aluno, responsável ou escola..."
            value={search.q ?? ""}
            onChange={(event) => {
              void navigate({
                search: event.target.value ? { q: event.target.value } : {},
                replace: true,
              });
            }}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Filtrar por status" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Em avaliação">Em avaliação</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={school} onValueChange={setSchool}>
          <SelectTrigger aria-label="Filtrar por escola" className="filter-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as escolas</SelectItem>
            {Array.from(new Set(students.map((student) => student.school)))
              .filter(Boolean)
              .map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {(search.q || status !== "Todos" || school !== "Todas") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("Todos");
              setSchool("Todas");
              void navigate({ search: {}, replace: true });
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      <StudentTable students={filtered} />
      <div className="table-bottom">
        <span>
          {filtered.length} de {students.length} alunos
        </span>
        <span>Cadastros fictícios</span>
      </div>
      <DemoFooter />
    </main>
  );
}
