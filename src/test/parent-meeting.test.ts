import { describe, expect, it } from "vitest";
import { DemoSessionService } from "@/services/session-service";

describe("reunião com os pais", () => {
  it("registra a reunião com data e duração e reserva o horário do profissional", async () => {
    const service = new DemoSessionService([]);
    const meeting = await service.create({
      studentId: "1",
      therapistId: "t1",
      date: "2026-11-21",
      start: "10:00",
      duration: 45,
      type: "Reunião com os pais",
    });
    expect((await service.list())[0]).toEqual({
      ...meeting,
      date: "2026-11-21",
      start: "10:00",
      duration: 45,
      type: "Reunião com os pais",
    });
    await expect(
      service.create({
        studentId: "2",
        therapistId: "t1",
        date: "2026-11-21",
        start: "10:30",
        duration: 45,
        type: "Atendimento individual",
      }),
    ).rejects.toThrow();
  });
  it("libera o horário seguinte ao término da reunião", async () => {
    const service = new DemoSessionService([]);
    await service.create({
      studentId: "1",
      therapistId: "t1",
      date: "2026-11-21",
      start: "10:00",
      duration: 45,
      type: "Reunião com os pais",
    });
    const next = await service.create({
      studentId: "2",
      therapistId: "t1",
      date: "2026-11-21",
      start: "10:45",
      duration: 45,
      type: "Atendimento individual",
    });
    expect(next.start).toBe("10:45");
    expect(await service.list()).toHaveLength(2);
  });
});
