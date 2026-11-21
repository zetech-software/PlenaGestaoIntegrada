import { describe, expect, it } from "vitest";
import {
  DemoSessionService,
  findConflict,
  endTime,
  sessionTherapistIds,
} from "@/services/session-service";
import type { SessionDraft } from "@/types/session";

const joint: SessionDraft = {
  studentId: "1",
  therapistId: "t1",
  secondTherapistId: "t2",
  date: "2026-11-21",
  start: "10:00",
  duration: 45,
  type: "Sessão conjunta — dois profissionais",
};
describe("sessão dupla", () => {
  it("reserva 90 minutos para o mesmo aluno", async () => {
    const service = new DemoSessionService([]);
    const session = await service.create({
      ...joint,
      secondTherapistId: "t3",
      type: "Sessão dupla — mesmo aluno",
      duration: 90,
    });
    expect(endTime(session)).toBe("11:30");
    expect(findConflict([session], { ...joint, start: "11:00" })?.id).toBe(session.id);
    await expect(
      service.create({ ...joint, type: "Sessão dupla — mesmo aluno", duration: 45 }),
    ).rejects.toThrow("90 minutos");
  });
  it("bloqueia conflitos de qualquer um dos dois profissionais", async () => {
    const service = new DemoSessionService([]);
    const session = await service.create(joint);
    expect(sessionTherapistIds(session)).toEqual(["t1", "t2"]);
    for (const therapistId of ["t1", "t2"]) {
      await expect(
        service.create({
          studentId: "2",
          therapistId,
          date: joint.date,
          start: "10:15",
          duration: 45,
          type: "Atendimento individual",
        }),
      ).rejects.toThrow();
    }
    const other = await service.create({
      studentId: "2",
      therapistId: "t3",
      date: joint.date,
      start: "10:15",
      duration: 45,
      type: "Atendimento individual",
    });
    expect(other.therapistId).toBe("t3");
  });
  it("recusa profissional repetido e sessão conjunta incompleta", async () => {
    const service = new DemoSessionService([]);
    await expect(service.create({ ...joint, secondTherapistId: "t1" })).rejects.toThrow(
      "diferentes",
    );
    const { secondTherapistId, ...missing } = joint;
    expect(secondTherapistId).toBe("t2");
    await expect(service.create(missing)).rejects.toThrow("segundo profissional");
  });
});
