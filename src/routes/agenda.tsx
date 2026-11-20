import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudents } from "@/hooks/use-students";
import { useSessions } from "@/hooks/use-sessions";
import { attendanceRate, endTime, sessionsOn, shiftDate, weekDays } from "@/services/session-service";
import { sessionStatuses, type SessionStatus } from "@/types/session";
import { demoDate } from "@/data/demo-students";
import { StudentAvatar, DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Plena Gestão Integrada" },
      { name: "description", content: "Agenda semanal de atendimentos, status das sessões e frequência na Plena Gestão Integrada." },
      { property: "og:title", content: "Agenda | Plena Gestão Integrada" },
      { property: "og:description", content: "Organize sessões, confirme presenças e acompanhe a frequência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgendaPage,
});

const statusTone: Record<SessionStatus, string> = {
  Pendente: "warm", Confirmado: "", Realizado: "info", Faltou: "warm", Cancelado: "muted",
};
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const asDate = (d: string) => new Date(`${d}T12:00:00Z`);

function AgendaPage() {
  const { students } = useStudents();
  const { sessions, addSession, setStatus } = useSessions();
  const [selected, setSelected] = useState(demoDate);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ studentId: "", start: "09:00", duration: "50", type: "Atendimento individual" });
  const days = weekDays(selected);
  const daySessions = sessionsOn(sessions, selected);
  const weekSessions = sessions.filter((x) => days.includes(x.date));
  const rate = attendanceRate(weekSessions);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.studentId) return setError("Escolha um aluno.");
    try {
      addSession({ studentId: form.studentId, date: selected, start: form.start, duration: Number(form.duration), type: form.type });
      setError("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível agendar.");
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><CalendarDays size={15} /> AGENDA E SESSÕES</div>
          <h1>Agenda</h1>
          <p>Organize seus atendimentos e acompanhe a frequência de cada jornada.</p>
        </div>
        <div className="heading-actions">
          <Button onClick={() => setShowForm((v) => !v)}><Plus /> Novo atendimento</Button>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card"><div className="stat-top"><span>Sessões na semana</span></div><div className="stat-value">{String(weekSessions.length).padStart(2, "0")}</div></article>
        <article className="stat-card"><div className="stat-top"><span>Realizadas</span></div><div className="stat-value">{String(weekSessions.filter((x) => x.status === "Realizado").length).padStart(2, "0")}</div></article>
        <article className="stat-card"><div className="stat-top"><span>Pendentes de confirmação</span></div><div className="stat-value">{String(weekSessions.filter((x) => x.status === "Pendente").length).padStart(2, "0")}</div></article>
        <article className="stat-card"><div className="stat-top"><span>Frequência na semana</span></div><div className="stat-value">{rate === null ? "—" : `${rate}%`}</div><div className="stat-foot">Realizadas ÷ (realizadas + faltas)</div></article>
      </div>

      <div className="week-strip">
        <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => setSelected(shiftDate(selected, -7))}><ChevronLeft /></Button>
        {days.map((day) => (
          <button key={day} type="button" className={`week-day ${day === selected ? "active" : ""}`} onClick={() => setSelected(day)} aria-pressed={day === selected}>
            <small>{weekday.format(asDate(day)).replace(".", "")}</small>
            <strong>{day.slice(8)}</strong>
            <span>{sessionsOn(sessions, day).length} {sessionsOn(sessions, day).length === 1 ? "sessão" : "sessões"}</span>
          </button>
        ))}
        <Button variant="ghost" size="icon" aria-label="Próxima semana" onClick={() => setSelected(shiftDate(selected, 7))}><ChevronRight /></Button>
      </div>

      {showForm ? (
        <form className="form-section agenda-form" onSubmit={submit}>
          <h2>Novo atendimento · {longDate.format(asDate(selected))}</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Aluno</label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger className="bg-card" aria-label="Aluno"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{students.filter((x) => x.status !== "Inativo").map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="form-field"><label htmlFor="ag-start">Horário</label><Input id="ag-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required /></div>
            <div className="form-field">
              <label>Duração</label>
              <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                <SelectTrigger className="bg-card" aria-label="Duração"><SelectValue /></SelectTrigger>
                <SelectContent>{["30", "45", "50", "60", "90"].map((d) => <SelectItem key={d} value={d}>{d} min</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-card" aria-label="Tipo"><SelectValue /></SelectTrigger>
                <SelectContent>{["Atendimento individual", "Encontro inicial", "Devolutiva à família", "Reunião escolar"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {error ? <p className="ai-error" role="alert">{error}</p> : null}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit">Agendar</Button>
          </div>
        </form>
      ) : null}

      <section>
        <div className="section-heading">
          <div><h2>{longDate.format(asDate(selected))}</h2><p>{daySessions.length} atendimentos</p></div>
        </div>
        <div className="schedule">
          {daySessions.length === 0 ? <p className="text-muted-foreground p-4">Nenhum atendimento neste dia.</p> : null}
          {daySessions.map((session) => {
            const student = students.find((x) => x.id === session.studentId);
            if (!student) return null;
            return (
              <div className="appointment" key={session.id}>
                <div className="appointment-time"><strong>{session.start}</strong><small>{endTime(session)}</small></div>
                <div className="appointment-divider" />
                <StudentAvatar student={student} />
                <div className="appointment-info">
                  <Link to="/alunos/$id" params={{ id: student.id }}><strong>{student.name}</strong></Link>
                  <small>{session.type} · {session.duration} min</small>
                </div>
                <span className={`status ${statusTone[session.status]}`}>{session.status}</span>
                <Select value={session.status} onValueChange={(v) => setStatus(session.id, v as SessionStatus)}>
                  <SelectTrigger className="w-36 bg-card" aria-label={`Alterar status de ${student.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{sessionStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </section>
      <DemoFooter />
    </main>
  );
}
