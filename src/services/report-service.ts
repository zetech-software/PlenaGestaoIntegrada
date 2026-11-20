import { demoTherapists, demoTherapistByStudent, type Therapist } from "@/data/demo-therapists";
import { attendanceRate } from "@/services/session-service";
import { planProgress } from "@/services/plan-service";
import { recordsFor } from "@/services/record-service";
import { displayStatus } from "@/services/finance-service";
import type { Charge, ChargeDisplayStatus } from "@/types/finance";
import type { InterventionPlan } from "@/types/plan";
import type { RecordEntry } from "@/types/record";
import type { Session } from "@/types/session";
import type { Student } from "@/types/student";

export interface Period {
  from: string;
  to: string;
}
export function inPeriod(date: string, period: Period) {
  return (!period.from || date >= period.from) && (!period.to || date <= period.to);
}
export function therapistOf(studentId: string): Therapist | undefined {
  const id = demoTherapistByStudent[studentId];
  return demoTherapists.find((t) => t.id === id);
}
export interface TherapistAttendance {
  therapist: Therapist;
  students: number;
  done: number;
  missed: number;
  pending: number;
  /** null quando ainda não há sessões realizadas nem faltas. */
  rate: number | null;
}
/** Frequência por terapeuta: realizados / (realizados + faltas) das sessões de cada profissional. */
export function attendanceByTherapist(
  sessions: Session[],
  students: Student[],
  period?: Period,
): TherapistAttendance[] {
  const visible = new Set(students.map((s) => s.id));
  const scoped = sessions.filter(
    (s) => visible.has(s.studentId) && (!period || inPeriod(s.date, period)),
  );
  return demoTherapists.map((therapist) => {
    const own = scoped.filter((s) => s.therapistId === therapist.id);
    const attended = new Set(own.map((s) => s.studentId));
    const linked = students.filter((s) => demoTherapistByStudent[s.id] === therapist.id);
    return {
      therapist,
      // Alunos vinculados ao terapeuta ou atendidos por ele no período.
      students: new Set([...linked.map((s) => s.id), ...attended]).size,
      done: own.filter((s) => s.status === "Realizado").length,
      missed: own.filter((s) => s.status === "Faltou").length,
      pending: own.filter((s) => s.status === "Pendente").length,
      rate: attendanceRate(own),
    };
  });
}
export function pendingSessions(sessions: Session[]) {
  return sessions.filter((s) => s.status === "Pendente");
}
export interface StudentReportRow {
  student: Student;
  therapist: string;
  done: number;
  missed: number;
  pending: number;
  rate: number | null;
  lastEvolution: string;
  plans: number;
  planProgress: number | null;
}
export function studentReport(
  students: Student[],
  sessions: Session[],
  records: RecordEntry[],
  plans: InterventionPlan[],
  period: Period,
): StudentReportRow[] {
  return students.map((student) => {
    const own = sessions.filter((s) => s.studentId === student.id && inPeriod(s.date, period));
    const studentPlans = plans.filter((p) => p.studentId === student.id && p.status !== "Rascunho");
    const goals = studentPlans.flatMap((p) => p.goals);
    return {
      student,
      therapist: therapistOf(student.id)?.name ?? "Sem vínculo",
      done: own.filter((s) => s.status === "Realizado").length,
      missed: own.filter((s) => s.status === "Faltou").length,
      pending: own.filter((s) => s.status === "Pendente").length,
      rate: attendanceRate(own),
      lastEvolution: recordsFor(records, student.id)[0]?.evolution ?? "Sem registro",
      plans: studentPlans.length,
      planProgress: goals.length ? planProgress({ goals }) : null,
    };
  });
}
export interface PlanReportRow {
  plan: InterventionPlan;
  studentName: string;
  progress: number;
}
export function planReport(
  plans: InterventionPlan[],
  students: Student[],
  period: Period,
): PlanReportRow[] {
  return plans
    .filter(
      (p) => p.startDate <= (period.to || "9999-12-31") && p.reviewDate >= (period.from || ""),
    )
    .map((plan) => ({
      plan,
      studentName: students.find((s) => s.id === plan.studentId)?.name ?? "—",
      progress: planProgress(plan),
    }));
}
export interface FinanceReportRow {
  charge: Charge;
  studentName: string;
  status: ChargeDisplayStatus;
}
/** Cobranças com vencimento no período, com os totais por situação (canceladas ficam de fora dos totais). */
export function financeReport(charges: Charge[], students: Student[], period: Period) {
  const rows: FinanceReportRow[] = charges
    .filter((c) => inPeriod(c.dueDate, period))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
    .map((charge) => ({
      charge,
      studentName: students.find((s) => s.id === charge.studentId)?.name ?? "—",
      status: displayStatus(charge),
    }));
  const total = (status: ChargeDisplayStatus) =>
    rows.filter((r) => r.status === status).reduce((sum, r) => sum + r.charge.amountCents, 0);
  return {
    rows,
    totals: { open: total("Em aberto"), overdue: total("Atrasado"), paid: total("Pago") },
  };
}
