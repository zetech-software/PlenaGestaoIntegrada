import { describe, expect, it } from "vitest";
import {
  DemoSessionService,
  conflictMessage,
  findConflict,
  recurrenceDates,
} from "@/services/session-service";
import { reminderMessage, whatsappLink } from "@/services/reminder-service";
import { DemoWaitlistService, validateWaitlist, waitingQueue } from "@/services/waitlist-service";
import { buildSchoolCopy, canShareWithSchool } from "@/services/plan-service";
import { demoPlans } from "@/data/demo-plans";
import { demoSessions } from "@/data/demo-sessions";
import { demoStudents } from "@/data/demo-students";
import { demoWaitlist } from "@/data/demo-waitlist";

// s7: aluno 1, terapeuta t1, 20/11 08:30–09:20
const at = (over: Partial<Parameters<typeof findConflict>[1]>) => ({
  studentId: "5",
  therapistId: "t1",
  date: "2026-11-20",
  start: "09:00",
  duration: 50,
  type: "x",
  ...over,
});
describe("conflito de horário", () => {
  it("bloqueia o mesmo terapeuta em horário sobreposto", () => {
    expect(findConflict(demoSessions, at({}))?.id).toBe("s7");
  });
  it("permite outro terapeuta no mesmo horário", () => {
    expect(findConflict(demoSessions, at({ therapistId: "t3" }))).toBeUndefined();
  });
  it("bloqueia o mesmo aluno com outro terapeuta no mesmo horário", () => {
    expect(findConflict(demoSessions, at({ studentId: "1", therapistId: "t3" }))?.id).toBe("s7");
  });
  it("horários que só se tocam não conflitam", () => {
    expect(findConflict(demoSessions, at({ start: "09:20" }))).toBeUndefined();
  });
});
describe("recorrência semanal", () => {
  it("gera a data e as semanas seguintes, no máximo 12", () => {
    expect(recurrenceDates("2026-11-20", 1)).toEqual(["2026-11-20"]);
    expect(recurrenceDates("2026-11-20", 3)).toEqual(["2026-11-20", "2026-11-27", "2026-12-04"]);
    expect(recurrenceDates("2026-11-20", 99)).toHaveLength(12);
    expect(recurrenceDates("2026-11-20", 0)).toHaveLength(1);
    expect(recurrenceDates("2026-12-25", 2)[1]).toBe("2027-01-01");
  });
  it("cria a série inteira ou nada", async () => {
    const service = new DemoSessionService(demoSessions);
    const free = recurrenceDates("2026-11-27", 3).map((date) => at({ date, start: "17:00" }));
    expect(await service.createMany(free)).toHaveLength(3);
    expect(await service.list()).toHaveLength(demoSessions.length + 3);
    // s11 (aluno 5, t3) é 23/11 14:00; a série de segundas bate nele em 23/11 e em 30/11 não
    const clash = ["2026-11-23", "2026-11-30"].map((date) =>
      at({ date, start: "14:00", therapistId: "t3" }),
    );
    const before = (await service.list()).length;
    await expect(service.createMany(clash)).rejects.toThrow(/23\/11/);
    expect(await service.list()).toHaveLength(before);
  });
  it("mensagem de conflito lista as datas", () => {
    expect(conflictMessage(["2026-11-23"])).toMatch(/23\/11/);
    expect(conflictMessage(["2026-11-23", "2026-11-30"])).toMatch(/23\/11, 30\/11.*Nenhuma/);
  });
});
describe("lembrete de confirmação", () => {
  it("monta mensagem só com nome, data e horário", () => {
    const msg = reminderMessage({
      guardian: "Camila Oliveira",
      studentFirstName: "Lucas",
      date: "2026-11-20",
      start: "08:30",
    });
    expect(msg).toContain("Olá, Camila!");
    expect(msg).toContain("Lucas em 20/11 às 08:30");
  });
  it("gera link do WhatsApp para telefone válido e recusa inválido", () => {
    const link = whatsappLink("(11) 98765-4321", "oi");
    expect(link).toBe("https://wa.me/5511987654321?text=oi");
    expect(whatsappLink("+55 11 98765-4321", "oi")).toBe("https://wa.me/5511987654321?text=oi");
    expect(whatsappLink("(11) 00000-0000", "oi")).toBeNull();
    expect(whatsappLink("", "oi")).toBeNull();
    expect(whatsappLink("1234", "oi")).toBeNull();
  });
});
describe("lista de espera", () => {
  it("ordena por quem espera há mais tempo e ignora agendados", () => {
    const entries = [
      ...demoWaitlist,
      { ...demoWaitlist[0]!, id: "w3", createdOn: "2026-10-01", status: "Agendado" as const },
    ];
    expect(waitingQueue(entries).map((e) => e.id)).toEqual(["w1", "w2"]);
  });
  it("não repete aluno e especialidade enquanto aguarda", () => {
    const dup = {
      studentId: "6",
      specialty: "Fonoaudiologia" as const,
      period: "Tarde" as const,
      notes: "",
    };
    expect(validateWaitlist(dup, demoWaitlist)).toMatch(/já está/);
    expect(validateWaitlist({ ...dup, specialty: "Psicologia" }, demoWaitlist)).toBeNull();
    expect(validateWaitlist({ ...dup, studentId: "" }, demoWaitlist)).toMatch(/aluno/);
  });
  it("adiciona, agenda, remove e não persiste", async () => {
    const service = new DemoWaitlistService(demoWaitlist);
    const added = await service.add({
      studentId: "4",
      specialty: "Psicologia",
      period: "Manhã",
      notes: " x ",
    });
    expect(added).toMatchObject({ status: "Aguardando", notes: "x" });
    await service.setStatus(added.id, "Agendado");
    expect((await service.list()).find((e) => e.id === added.id)?.status).toBe("Agendado");
    await service.remove(added.id);
    expect(await service.list()).toHaveLength(demoWaitlist.length);
    await expect(
      service.add({ studentId: "6", specialty: "Fonoaudiologia", period: "Tarde", notes: "" }),
    ).rejects.toThrow();
    expect(await new DemoWaitlistService(demoWaitlist).list()).toHaveLength(demoWaitlist.length);
  });
});

describe("PEI para a escola", () => {
  it("só o PEI pode ser compartilhado", () => {
    expect(canShareWithSchool({ kind: "PEI" })).toBe(true);
    expect(canShareWithSchool({ kind: "PTI" })).toBe(false);
  });
  it("a versão da escola não leva resumo clínico nem a área de atuação", () => {
    const plan = demoPlans.find((p) => p.kind === "PEI");
    const student = demoStudents.find((s) => s.id === plan?.studentId);
    if (!plan || !student) throw new Error("fixture");
    const copy = buildSchoolCopy(plan, student);
    const text = JSON.stringify(copy);
    expect(text).not.toContain(plan.summary);
    expect(text).not.toContain(plan.specialty);
    expect(copy.school).toBe(student.school);
    expect(copy.goals).toHaveLength(plan.goals.length);
    expect(Object.keys(copy.goals[0] ?? {}).sort()).toEqual(
      ["deadline", "description", "progress", "strategy"].sort(),
    );
  });
});
