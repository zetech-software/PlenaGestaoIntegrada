import { describe, expect, it } from "vitest";
import { areaForPath, canAccess, canSeeStudent, primaryRole } from "@/services/permissions";
describe("perfis de acesso", () => {
  it("só admin acessa Usuários", () => {
    expect(canAccess("admin", "usuarios")).toBe(true);
    expect(canAccess("clinica", "usuarios")).toBe(false);
    expect(canAccess("terapeuta", "usuarios")).toBe(false);
  });
  it("clínica vê prontuários e todos os alunos", () => {
    expect(canAccess("clinica", "prontuarios")).toBe(true);
    expect(canSeeStudent("clinica", [], "5")).toBe(true);
  });
  it("terapeuta vê só alunos vinculados", () => {
    expect(canSeeStudent("terapeuta", ["1"], "1")).toBe(true);
    expect(canSeeStudent("terapeuta", ["1"], "2")).toBe(false);
  });
  it("sem perfil não acessa nada", () => {
    expect(canAccess(null, "dashboard")).toBe(false);
  });
  it("maior privilégio vence e rotas mapeiam áreas", () => {
    expect(primaryRole(["terapeuta", "admin"])).toBe("admin");
    expect(areaForPath("/alunos/1/prontuario")).toBe("prontuarios");
  });
});
