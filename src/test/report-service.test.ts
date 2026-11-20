import { describe, expect, it } from "vitest";
import {
  attendanceByTherapist,
  inPeriod,
  pendingSessions,
  planReport,
  studentReport,
} from "@/services/report-service";
import { demoSessions } from "@/data/demo-sessions";
import { demoStudents } from "@/data/demo-students";
import { demoPlans } from "@/data/demo-plans";
import { demoRecords } from "@/data/demo-records";

const november = { from: "2026-11-01", to: "2026-11-30" };
describe("relatórios", () => {
  it("calcula a frequência por terapeuta via vínculo do aluno", () => {
    const rows = attendanceByTherapist(demoSessions, demoStudents, november);
    const by = (id: string) => rows.find((r) => r.therapist.id === id);
    // t1 = alunos 1, 4, 7: realizadas s1 e s4 (aluno 7); sem faltas -> 100%
    expect(by("t1")).toMatchObject({ students: 3, done: 2, missed: 0, rate: 100 });
    // t2 = alunos 2, 6, 8: s3 faltou, s5 realizada -> 50%
    expect(by("t2")).toMatchObject({ done: 1, missed: 1, rate: 50 });
    // t3 = alunos 3, 5: s2 realizada -> 100%
    expect(by("t3")).toMatchObject({ done: 1, missed: 0, rate: 100 });
  });
  it("devolve frequência nula quando não há realizadas nem faltas", () => {
    const rows = attendanceByTherapist(demoSessions, demoStudents, {
      from: "2027-01-01",
      to: "2027-01-31",
    });
    expect(rows.every((r) => r.rate === null)).toBe(true);
  });
  it("respeita os alunos visíveis ao perfil", () => {
    const rows = attendanceByTherapist(
      demoSessions,
      demoStudents.filter((s) => s.id === "2"),
    );
    expect(rows.reduce((sum, r) => sum + r.students, 0)).toBe(1);
  });
  it("conta apenas sessões pendentes", () => {
    expect(pendingSessions(demoSessions).map((s) => s.id)).toEqual(["s10", "s11", "s12"]);
  });
  it("filtra períodos", () => {
    expect(inPeriod("2026-11-15", november)).toBe(true);
    expect(inPeriod("2026-12-01", november)).toBe(false);
    expect(inPeriod("2026-12-01", { from: "", to: "" })).toBe(true);
  });
  it("monta relatório de alunos e de planos", () => {
    const rows = studentReport(demoStudents, demoSessions, demoRecords, demoPlans, november);
    const lucas = rows.find((r) => r.student.id === "1");
    expect(lucas).toMatchObject({ therapist: "Marina Duarte", plans: 2, lastEvolution: "Avançou" });
    expect(lucas?.planProgress).toBe(55);
    expect(planReport(demoPlans, demoStudents, november).length).toBeGreaterThan(0);
    expect(planReport(demoPlans, demoStudents, { from: "2030-01-01", to: "" })).toEqual([]);
  });
});
