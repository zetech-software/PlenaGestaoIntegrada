import { describe, expect, it } from "vitest";
import { DemoStudentService, filterStudents } from "@/services/student-service";
describe("Demonstration data boundaries", () => {
  it("keeps temporary registrations out of a fresh demonstration session", async () => {
    const session = new DemoStudentService();
    const original = (await session.list()).length;
    await session.create({
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
    expect(await session.list()).toHaveLength(original + 1);
    expect(await new DemoStudentService().list()).toHaveLength(original);
    expect(
      (await new DemoStudentService().list()).some(
        (student) => student.name === "Aluno fictício de teste",
      ),
    ).toBe(false);
  });
  it("does not mutate source data through a returned list", async () => {
    const session = new DemoStudentService();
    const student = (await session.list())[0];
    if (!student) throw new Error("Missing demonstration fixture");
    student.name = "Changed";
    expect((await session.get(student.id))?.name).toBe("Lucas Oliveira");
  });
  it("combines search, status and school filters", async () => {
    const students = await new DemoStudentService().list();
    expect(
      filterStudents(students, "pedro", "Em avaliação", "Colégio Horizonte").map(
        (student) => student.name,
      ),
    ).toEqual(["Pedro Santos"]);
    expect(filterStudents(students, "pedro", "Ativo", "Todas")).toEqual([]);
    expect(filterStudents(students, "jardim", "Ativo", "Todas")).toHaveLength(2);
  });
});
