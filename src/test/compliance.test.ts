import { describe, expect, it } from "vitest";
import { DemoAuditService, filterAudit, sortAudit } from "@/services/audit-service";
import {
  DemoConsentService,
  activeConsent,
  hasConsent,
  validateConsent,
} from "@/services/consent-service";
import {
  RETENTION_YEARS,
  buildStudentExport,
  exportFileName,
  retentionUntil,
} from "@/services/export-service";
import { canAccess, canExportStudent, canManageConsent, areaForPath } from "@/services/permissions";
import { demoConsents } from "@/data/demo-consents";
import { demoPlans } from "@/data/demo-plans";
import { demoAnamneses, demoRecords } from "@/data/demo-records";
import { demoSessions } from "@/data/demo-sessions";
import { demoStudents } from "@/data/demo-students";

const base = {
  userEmail: "a@teste.local",
  role: "admin",
  action: "visualizou" as const,
  resource: "aluno" as const,
  studentId: "1",
  detail: "",
};
describe("auditoria", () => {
  it("registra com id e horário e lista o mais recente primeiro", async () => {
    let n = 0;
    const service = new DemoAuditService(() => `2026-11-20T10:00:0${n++}.000Z`);
    await service.record(base);
    await service.record({ ...base, action: "editou" });
    const list = sortAudit(await service.list());
    expect(list.map((e) => e.action)).toEqual(["editou", "visualizou"]);
    expect(new Set(list.map((e) => e.id)).size).toBe(2);
  });
  it("não deixa alterar eventos por uma lista devolvida", async () => {
    const service = new DemoAuditService();
    await service.record(base);
    const list = await service.list();
    if (!list[0]) throw new Error("fixture");
    list[0].userEmail = "outro@teste.local";
    expect((await service.list())[0]?.userEmail).toBe("a@teste.local");
  });
  it("filtra por ação e por aluno", async () => {
    const service = new DemoAuditService();
    await service.record(base);
    await service.record({ ...base, action: "exportou", studentId: "2" });
    const all = await service.list();
    expect(filterAudit(all, { action: "exportou", studentId: "" })).toHaveLength(1);
    expect(filterAudit(all, { action: "Todas", studentId: "1" })).toHaveLength(1);
    expect(filterAudit(all, { action: "Todas", studentId: "" })).toHaveLength(2);
  });
});
describe("consentimento", () => {
  it("considera vigente só o concedido e não revogado", () => {
    expect(hasConsent(demoConsents, "1", "tratamento")).toBe(true);
    expect(hasConsent(demoConsents, "2", "ia")).toBe(false); // revogado
    expect(hasConsent(demoConsents, "3", "tratamento")).toBe(false);
    expect(activeConsent(demoConsents, "1", "escola")?.guardian).toBe("Camila Oliveira");
  });
  it("valida responsável e bloqueia duplicidade vigente", () => {
    expect(validateConsent({ studentId: "3", purpose: "ia", guardian: "ab" }, [])).toMatch(
      /responsável/,
    );
    expect(
      validateConsent({ studentId: "1", purpose: "tratamento", guardian: "Camila" }, demoConsents),
    ).toMatch(/vigente/);
    expect(
      validateConsent({ studentId: "3", purpose: "tratamento", guardian: "Juliana" }, demoConsents),
    ).toBeNull();
  });
  it("concede, revoga mantendo o histórico e permite conceder de novo", async () => {
    const service = new DemoConsentService(demoConsents);
    const granted = await service.grant({
      studentId: "3",
      purpose: "ia",
      guardian: "Juliana Santos",
    });
    expect(granted.revokedOn).toBeNull();
    await service.revoke(granted.id);
    const afterRevoke = await service.list();
    expect(afterRevoke.find((c) => c.id === granted.id)?.revokedOn).not.toBeNull();
    expect(hasConsent(afterRevoke, "3", "ia")).toBe(false);
    await service.grant({ studentId: "3", purpose: "ia", guardian: "Juliana Santos" });
    expect((await service.list()).filter((c) => c.studentId === "3")).toHaveLength(2);
    await expect(service.revoke("nao-existe")).rejects.toThrow();
  });
  it("não persiste entre sessões", async () => {
    await new DemoConsentService(demoConsents).grant({
      studentId: "3",
      purpose: "ia",
      guardian: "Juliana Santos",
    });
    expect(await new DemoConsentService(demoConsents).list()).toHaveLength(demoConsents.length);
  });
});
describe("exportação e retenção", () => {
  it("guarda mínima = último registro + 20 anos", () => {
    expect(RETENTION_YEARS).toBe(20);
    expect(retentionUntil(["2026-11-06", "2026-11-13"])).toBe("2046-11-13");
    expect(retentionUntil([])).toBeNull();
    expect(retentionUntil(["2024-02-29"])).toBe("2044-02-29");
  });
  it("exporta só os dados do aluno pedido", () => {
    const student = demoStudents[0];
    if (!student) throw new Error("fixture");
    const data = buildStudentExport({
      student,
      anamnesis: demoAnamneses.find((a) => a.studentId === "1"),
      records: demoRecords,
      sessions: demoSessions,
      plans: demoPlans,
      consents: demoConsents,
      exportedAt: "2026-11-20T10:00:00.000Z",
    });
    expect(data.student.id).toBe("1");
    expect(data.records.every((r) => r.studentId === "1")).toBe(true);
    expect(data.sessions.every((s) => s.studentId === "1")).toBe(true);
    expect(data.plans.every((p) => p.studentId === "1")).toBe(true);
    expect(data.consents.every((c) => c.studentId === "1")).toBe(true);
    expect(data.retention.retainUntil).toBe("2046-11-16");
  });
  it("nomeia o arquivo sem acentos nem espaços", () => {
    expect(exportFileName({ id: "9", name: "João da Silva Pinto" })).toBe(
      "plena-joao-da-silva-pinto-dados.json",
    );
  });
});
describe("permissões de conformidade", () => {
  it("só admin vê a auditoria", () => {
    expect(canAccess("admin", "auditoria")).toBe(true);
    expect(canAccess("clinica", "auditoria")).toBe(false);
    expect(canAccess("terapeuta", "auditoria")).toBe(false);
    expect(areaForPath("/auditoria")).toBe("auditoria");
  });
  it("só admin e clínica registram consentimento e exportam dados", () => {
    for (const fn of [canManageConsent, canExportStudent]) {
      expect(fn("admin")).toBe(true);
      expect(fn("clinica")).toBe(true);
      expect(fn("terapeuta")).toBe(false);
      expect(fn(null)).toBe(false);
    }
  });
});
