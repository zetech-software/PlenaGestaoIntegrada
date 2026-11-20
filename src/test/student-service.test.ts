import { describe, expect, it } from "vitest";
import { DemoStudentService, filterStudents } from "@/services/student-service";
describe("Demonstration data boundaries", () => {
  it("keeps temporary registrations out of a fresh demonstration session", () => {
    const session = new DemoStudentService();
    const original = session.list().length;
    session.create({
      name: "Aluno fictício de teste",
      birthDate: "2018-03-01",
      school: "Escola fictícia",
      grade: "2º ano",
      guardian: "Responsável fictício",
      relationship: "Mãe",
      phone: "",
      email: "",
      notes: "",
      status: "Ativo",
    });
    expect(session.list()).toHaveLength(original + 1);
    expect(new DemoStudentService().list()).toHaveLength(original);
    expect(
      new DemoStudentService().list().some((student) => student.name === "Aluno fictício de teste"),
    ).toBe(false);
  });
  it("does not mutate source data through a returned list", () => {
    const session = new DemoStudentService();
    const student = session.list()[0];
    if (!student) throw new Error("Missing demonstration fixture");
    student.name = "Changed";
    expect(session.get(student.id)?.name).toBe("Lucas Oliveira");
  });
  it("combines search, status and school filters", () => {
    const students = new DemoStudentService().list();
    expect(
      filterStudents(students, "pedro", "Em avaliação", "Colégio Horizonte").map(
        (student) => student.name,
      ),
    ).toEqual(["Pedro Santos"]);
    expect(filterStudents(students, "pedro", "Ativo", "Todas")).toEqual([]);
    expect(filterStudents(students, "jardim", "Ativo", "Todas")).toHaveLength(2);
  });
});
