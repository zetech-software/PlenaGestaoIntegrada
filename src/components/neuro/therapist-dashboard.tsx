import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CalendarCheck, Users, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudents } from "@/hooks/use-students";
import { useSessions } from "@/hooks/use-sessions";
import { demoDate } from "@/data/demo-students";
import { endTime, sessionsOn } from "@/services/session-service";
import { StudentAvatar, StatusBadge, DemoFooter } from "./student-ui";

export function TherapistDashboard() {
  const { students, isLoading: studentsLoading, error: studentsError } = useStudents();
  const { sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions();
  const [date, setDate] = useState(demoDate);
  const loading = studentsLoading || sessionsLoading;
  const appointments = sessionsOn(sessions, date);
  const stats = [
    { title: "Meus alunos", value: students.length, icon: Users },
    { title: "Atendimentos no dia", value: appointments.filter((s) => s.status !== "Cancelado").length, icon: CalendarDays },
    { title: "Aguardando confirmação", value: appointments.filter((s) => s.status === "Pendente").length, icon: CalendarCheck },
  ];

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACOMPANHAMENTO PROFISSIONAL</div>
          <h1>Meu painel</h1>
          <p>Minha agenda e meus alunos vinculados na clínica.</p>
        </div>
        <Button asChild><Link to="/agenda"><CalendarDays /> Abrir calendário</Link></Button>
      </div>
      {studentsError || sessionsError ? <p role="alert" className="mb-4 text-destructive">Não foi possível carregar os acompanhamentos.</p> : null}
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3" aria-busy={loading}>
        {stats.map((stat) => (
          <article key={stat.title} className="stat-card">
            <div className="stat-top"><span>{stat.title}</span><span className="stat-icon"><stat.icon size={18} /></span></div>
            <div className="stat-value">{loading ? "—" : stat.value.toString().padStart(2, "0")}</div>
          </article>
        ))}
      </div>
      <section aria-labelledby="my-agenda-heading" className="mb-10">
        <div className="section-heading flex-wrap gap-3">
          <h2 id="my-agenda-heading">Minha agenda</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="therapist-date" className="text-sm text-muted-foreground">Data</label>
            <Input id="therapist-date" type="date" className="w-40 bg-card" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} />
          </div>
        </div>
        <div className="schedule" aria-busy={loading}>
          {loading ? <p role="status">Carregando agenda...</p> : !appointments.length ? <p className="py-6 text-sm text-muted-foreground">Nenhum atendimento neste dia.</p> : null}
          {!loading && appointments.map((appointment) => {
            const student = students.find((s) => s.id === appointment.studentId);
            if (!student) return null;
            return (
              <div key={appointment.id} className="flex flex-wrap items-center gap-4 border-b border-border py-4">
                <div className="w-16 shrink-0"><strong className="block text-sm">{appointment.start}</strong><small className="text-muted-foreground">{endTime(appointment)}</small></div>
                <StudentAvatar student={student} />
                <div className="min-w-0 flex-1 basis-32">
                  <Link to="/alunos/$id" params={{ id: student.id }} className="text-sm font-semibold break-words">{student.name}</Link>
                  <small className="block text-muted-foreground">{appointment.type}</small>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={14} />{appointment.duration} min</span>
                <span className={`status ${appointment.status === "Pendente" ? "warm" : appointment.status === "Cancelado" ? "muted" : ""}`}>{appointment.status}</span>
                <Button asChild variant="ghost" size="icon"><Link to="/alunos/$id/prontuario" params={{ id: student.id }} aria-label={`Abrir prontuário de ${student.name}`} title="Abrir prontuário"><ArrowRight /></Link></Button>
              </div>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="my-students-heading">
        <div className="section-heading"><h2 id="my-students-heading">Meus alunos</h2><Button asChild variant="ghost" size="sm"><Link to="/alunos">Ver todos <ArrowRight /></Link></Button></div>
        {loading ? <p role="status">Carregando alunos...</p> : !students.length ? <p className="py-6 text-sm text-muted-foreground">Nenhum aluno vinculado ao seu acompanhamento.</p> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3"><StudentAvatar student={student} /><Link to="/alunos/$id" params={{ id: student.id }} className="min-w-0 font-semibold text-sm break-words">{student.name}</Link></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StatusBadge status={student.status} /><Button asChild variant="ghost" size="sm"><Link to="/alunos/$id" params={{ id: student.id }}>Ver aluno <ArrowRight /></Link></Button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <DemoFooter />
    </main>
  );
}