import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserRound, School, Users, Info, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from "@/hooks/use-students";
import { demoDate } from "@/data/demo-students";
import { DemoFooter } from "@/components/neuro/student-ui";
import type { StudentStatus } from "@/types/student";
export const Route = createFileRoute("/alunos/novo")({
  head: () => ({
    meta: [
      { title: "Novo aluno | Ze Tech Neuro" },
      {
        name: "description",
        content:
          "Cadastro de aluno para a demonstração da Ze Tech Neuro. Dados não são armazenados permanentemente.",
      },
      { property: "og:title", content: "Novo aluno | Ze Tech Neuro" },
      {
        property: "og:description",
        content: "Cadastro demonstrativo com informações fictícias do aluno, escola e responsável.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewStudent,
});
function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={150}
        {...(type === "date" ? { max: demoDate, min: "1990-01-01" } : {})}
      />
    </div>
  );
}
function NewStudent() {
  const { addStudent } = useStudents();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StudentStatus>("Ativo");
  const [relationship, setRelationship] = useState("Mãe");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    if (!value("name") || !value("guardian")) return;
    const student = addStudent({
      name: value("name"),
      birthDate: value("birthDate"),
      school: value("school"),
      grade: value("grade"),
      guardian: value("guardian"),
      relationship,
      phone: value("phone"),
      email: value("email"),
      notes: value("notes"),
      status,
    });
    void navigate({ to: "/alunos/$id", params: { id: student.id }, search: { created: true } });
  }
  return (
    <main className="page">
      <Link to="/alunos" className="back-link">
        <ArrowLeft size={14} /> Voltar para alunos
      </Link>
      <div className="page-heading">
        <div>
          <h1>Novo aluno</h1>
          <p>O primeiro passo de uma nova jornada.</p>
        </div>
      </div>
      <div className="demo-note">
        <Info />
        Use somente informações fictícias. Este cadastro é temporário e desaparece ao recarregar a
        página.
      </div>
      <form onSubmit={onSubmit}>
        <section className="form-section">
          <h2>
            <UserRound /> Dados do aluno
          </h2>
          <p>Informações de identificação · Campos com * são obrigatórios</p>
          <div className="form-grid">
            <Field
              label="Nome completo"
              name="name"
              required
              placeholder="Ex.: João Silva (fictício)"
            />
            <Field label="Data de nascimento" name="birthDate" type="date" required />
            <div className="form-field">
              <label htmlFor="student-status">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (value === "Ativo" || value === "Em avaliação" || value === "Inativo")
                    setStatus(value);
                }}
              >
                <SelectTrigger id="student-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em avaliação">Em avaliação</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
        <section className="form-section">
          <h2>
            <School /> Informações escolares
          </h2>
          <p>O contexto escolar do aluno.</p>
          <div className="form-grid">
            <Field label="Escola" name="school" placeholder="Nome fictício da escola" />
            <Field
              label="Série / Ano"
              name="grade"
              placeholder="Ex.: 3º ano do Ensino Fundamental"
            />
          </div>
        </section>
        <section className="form-section">
          <h2>
            <Users /> Responsável
          </h2>
          <p>Informações de contato demonstrativas.</p>
          <div className="form-grid">
            <Field
              label="Nome do responsável"
              name="guardian"
              required
              placeholder="Nome fictício do responsável"
            />
            <div className="form-field">
              <label htmlFor="relationship">Parentesco</label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Mãe", "Pai", "Avó / Avô", "Outro responsável"].map((value) => (
                    <SelectItem value={value} key={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Telefone" name="phone" type="tel" placeholder="(11) 00000-0000" />
            <Field label="E-mail" name="email" type="email" placeholder="responsavel@example.com" />
            <div className="form-field full">
              <label htmlFor="notes">Observações cadastrais</label>
              <Textarea
                name="notes"
                id="notes"
                className="bg-card"
                placeholder="Somente observações fictícias, sem dados clínicos."
                maxLength={1000}
              />
            </div>
          </div>
        </section>
        <div className="form-actions">
          <Button type="button" variant="outline" asChild>
            <Link to="/alunos">Cancelar</Link>
          </Button>
          <Button type="submit">
            <Check /> Cadastrar aluno
          </Button>
        </div>
      </form>
      <DemoFooter />
    </main>
  );
}
