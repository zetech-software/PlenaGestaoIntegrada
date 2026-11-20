import { describe, expect, it } from "vitest";
import {
  DemoTenantService,
  filterTenants,
  formatDocument,
  isValidCnpj,
  isValidCpf,
  onlyDigits,
  summarizeTenants,
  validateTenant,
} from "@/services/tenant-service";
import { areaForPath, canAccess, primaryRole } from "@/services/permissions";
import { demoTenants } from "@/data/demo-tenants";
import type { TenantDraft } from "@/types/tenant";

const clinic: TenantDraft = {
  kind: "clinica",
  name: "Clínica Nova",
  document: "55.566.677/0001-83",
  ownerName: "Maria Silva",
  ownerEmail: "maria@nova.example",
  phone: "",
  registration: "",
  seats: 5,
};
const independent: TenantDraft = {
  kind: "autonomo",
  name: "Carla Dias — Terapia ocupacional",
  document: "529.982.247-25",
  ownerName: "Carla Dias",
  ownerEmail: "carla@exemplo.example",
  phone: "",
  registration: "CREFITO 3/000000",
  seats: 1,
};
describe("documentos", () => {
  it("valida CPF pelos dígitos verificadores", () => {
    expect(isValidCpf("123.456.789-09")).toBe(true);
    expect(isValidCpf("12345678909")).toBe(true);
    expect(isValidCpf("123.456.789-10")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
  it("valida CNPJ pelos dígitos verificadores", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000182")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("1122233300018")).toBe(false);
  });
  it("formata e extrai dígitos", () => {
    expect(formatDocument("clinica", "11222333000181")).toBe("11.222.333/0001-81");
    expect(formatDocument("autonomo", "12345678909")).toBe("123.456.789-09");
    expect(onlyDigits("11.222.333/0001-81")).toBe("11222333000181");
  });
});
describe("cadastro de clientes", () => {
  it("aceita clínica e autônomo válidos", () => {
    expect(validateTenant(clinic, demoTenants)).toBeNull();
    expect(validateTenant(independent, demoTenants)).toBeNull();
  });
  it("recusa documento do tipo errado ou inválido", () => {
    expect(validateTenant({ ...clinic, document: "12345678909" }, [])).toBe("CNPJ inválido.");
    expect(validateTenant({ ...independent, document: "11222333000181" }, [])).toBe(
      "CPF inválido.",
    );
  });
  it("recusa documento e e-mail repetidos, mesmo com máscara ou caixa diferente", () => {
    expect(validateTenant({ ...clinic, document: "11.222.333/0001-81" }, demoTenants)).toMatch(
      /documento/,
    );
    expect(
      validateTenant({ ...clinic, ownerEmail: "CONTATO@horizonte.example" }, demoTenants),
    ).toMatch(/e-mail/);
  });
  it("valida nome, responsável, e-mail e vagas", () => {
    expect(validateTenant({ ...clinic, name: "ab" }, [])).toMatch(/nome do cliente/);
    expect(validateTenant({ ...clinic, ownerName: "" }, [])).toMatch(/responsável/);
    expect(validateTenant({ ...clinic, ownerEmail: "sem-arroba" }, [])).toMatch(/inválido/);
    expect(validateTenant({ ...clinic, seats: 0 }, [])).toMatch(/entre 1 e 200/);
    expect(validateTenant({ ...clinic, seats: 201 }, [])).toMatch(/entre 1 e 200/);
    expect(validateTenant({ ...clinic, seats: 2.5 }, [])).toMatch(/entre 1 e 200/);
    expect(validateTenant({ ...independent, seats: 2 }, [])).toMatch(/uma única vaga/);
  });
  it("cadastra em implantação, normaliza os dados e não persiste", async () => {
    const service = new DemoTenantService(demoTenants);
    const created = await service.create({ ...clinic, ownerEmail: "  Maria@Nova.Example " });
    expect(created).toMatchObject({
      status: "Em implantação",
      document: "55566677000183",
      ownerEmail: "maria@nova.example",
    });
    expect(await service.list()).toHaveLength(demoTenants.length + 1);
    await expect(service.create(clinic)).rejects.toThrow(/documento/);
    expect(await new DemoTenantService(demoTenants).list()).toHaveLength(demoTenants.length);
  });
  it("suspende e reativa; id inexistente dá erro", async () => {
    const service = new DemoTenantService(demoTenants);
    await service.setStatus("cl1", "Suspenso");
    expect((await service.list()).find((t) => t.id === "cl1")?.status).toBe("Suspenso");
    await service.setStatus("cl1", "Ativo");
    expect((await service.list()).find((t) => t.id === "cl1")?.status).toBe("Ativo");
    await expect(service.setStatus("nao-existe", "Ativo")).rejects.toThrow(/não encontrado/);
  });
});
describe("busca e resumo", () => {
  it("busca por nome sem acento, e-mail e documento com ou sem máscara", () => {
    const f = (query: string) =>
      filterTenants(demoTenants, { query, kind: "Todos", status: "Todos" }).map((t) => t.id);
    expect(f("horizonte")).toEqual(["cl1"]);
    expect(f("ana souza")).toEqual(["cl2"]);
    expect(f("jardim.example")).toEqual(["cl3"]);
    expect(f("11.222.333")).toEqual(["cl1"]);
    expect(f("12345678909")).toEqual(["cl2"]);
    expect(f("psicologia")).toEqual(["cl2"]);
  });
  it("filtra por tipo e situação e ordena do mais novo para o mais antigo", () => {
    expect(
      filterTenants(demoTenants, { query: "", kind: "autonomo", status: "Todos" }).map((t) => t.id),
    ).toEqual(["cl4", "cl2"]);
    expect(
      filterTenants(demoTenants, { query: "", kind: "Todos", status: "Suspenso" }).map((t) => t.id),
    ).toEqual(["cl3"]);
  });
  it("resume clientes e vagas sem contar os suspensos", () => {
    expect(summarizeTenants(demoTenants)).toEqual({
      clinics: 2,
      independents: 2,
      active: 2,
      suspended: 1,
      seats: 8 + 1 + 1,
    });
  });
});
describe("operador da plataforma", () => {
  it("só abre o painel da plataforma, nunca as áreas de um cliente", () => {
    expect(canAccess("plataforma", "plataforma")).toBe(true);
    for (const area of [
      "dashboard",
      "alunos",
      "agenda",
      "prontuarios",
      "financeiro",
      "usuarios",
      "auditoria",
      "configuracoes",
    ] as const) {
      expect(canAccess("plataforma", area)).toBe(false);
    }
    expect(areaForPath("/plataforma")).toBe("plataforma");
  });
  it("ninguém além do operador abre o painel", () => {
    for (const role of ["admin", "clinica", "terapeuta", null] as const) {
      expect(canAccess(role, "plataforma")).toBe(false);
    }
  });
  it("conta de operador não herda perfil clínico", () => {
    expect(primaryRole(["admin", "plataforma"])).toBe("plataforma");
    expect(primaryRole(["terapeuta", "plataforma"])).toBe("plataforma");
    expect(primaryRole(["admin", "terapeuta"])).toBe("admin");
  });
});
