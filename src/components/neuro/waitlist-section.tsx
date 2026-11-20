import { useState } from "react";
import { Hourglass } from "lucide-react";
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
import { useWaitlist } from "@/hooks/use-waitlist";
import { waitingQueue } from "@/services/waitlist-service";
import { formatDate } from "@/services/student-service";
import { specialties, type Specialty } from "@/types/record";
import { waitPeriods, type WaitPeriod } from "@/types/waitlist";

/** Quem aguarda uma vaga, por especialidade e período preferido. */
export function WaitlistSection() {
  const { students } = useStudents();
  const { entries, isLoading, add, setStatus, remove } = useWaitlist();
  const [studentId, setStudentId] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("Neuropsicopedagogia");
  const [period, setPeriod] = useState<WaitPeriod>("Qualquer");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const queue = waitingQueue(entries);
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <section className="waitlist" aria-labelledby="waitlist-heading">
      <div className="section-heading">
        <div>
          <h2 id="waitlist-heading">
            <Hourglass size={16} /> Lista de espera
          </h2>
          <p>{isLoading ? "Carregando..." : `${queue.length} aguardando vaga`}</p>
        </div>
      </div>
      <form
        className="form-section agenda-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await add({ studentId, specialty, period, notes });
            setStudentId("");
            setNotes("");
          });
        }}
      >
        <div className="form-grid">
          <div className="form-field">
            <label>Aluno</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="bg-card" aria-label="Aluno na lista de espera">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((s) => s.status !== "Inativo")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="form-field">
            <label>Especialidade</label>
            <Select value={specialty} onValueChange={(v) => setSpecialty(v as Specialty)}>
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
          </div>
          <div className="form-field">
            <label>Período preferido</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as WaitPeriod)}>
              <SelectTrigger className="bg-card" aria-label="Período preferido">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {waitPeriods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="form-field">
            <label htmlFor="wait-notes">Observação</label>
            <Input
              id="wait-notes"
              value={notes}
              maxLength={160}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit">Adicionar à lista</Button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive mb-3">
          {error}
        </p>
      ) : null}
      <div className="schedule">
        {!isLoading && queue.length === 0 ? (
          <p className="text-muted-foreground p-4">Ninguém aguardando vaga.</p>
        ) : null}
        {queue.map((entry, index) => (
          <div className="appointment" key={entry.id}>
            <span className="status info">{index + 1}º</span>
            <div className="appointment-info">
              <strong>{nameOf(entry.studentId)}</strong>
              <small>
                {entry.specialty} · {entry.period} · desde {formatDate(entry.createdOn)}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </small>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void run(() => setStatus(entry.id, "Agendado"))}
            >
              Marcar como agendado
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void run(() => remove(entry.id))}>
              Remover
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
