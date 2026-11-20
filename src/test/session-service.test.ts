import { describe, expect, it } from "vitest";
import {
  DemoSessionService,
  attendanceRate,
  findConflict,
  weekDays,
  endTime,
} from "@/services/session-service";
import { demoSessions } from "@/data/demo-sessions";

describe("agenda demonstrativa", () => {
  it("bloqueia horário sobreposto no mesmo dia", () => {
    const service = new DemoSessionService(demoSessions);
    expect(() =>
      service.create({
        studentId: "5",
        therapistId: "t3",
        date: "2026-11-20",
        start: "09:00",
        duration: 50,
        type: "x",
      }),
    ).toThrow();
  });
  it("permite reutilizar horário de sessão cancelada", () => {
    expect(
      findConflict(demoSessions, {
        studentId: "5",
        therapistId: "t3",
        date: "2026-11-19",
        start: "11:00",
        duration: 50,
        type: "x",
      }),
    ).toBeUndefined();
  });
  it("novos agendamentos começam pendentes e não persistem", () => {
    const service = new DemoSessionService(demoSessions);
    expect(
      service.create({
        studentId: "5",
        therapistId: "t3",
        date: "2026-11-20",
        start: "17:00",
        duration: 50,
        type: "x",
      }).status,
    ).toBe("Pendente");
    expect(new DemoSessionService(demoSessions).list()).toHaveLength(demoSessions.length);
  });
  it("frequência considera realizados e faltas", () => {
    expect(
      attendanceRate([
        { ...demoSessions[0]!, status: "Realizado" },
        { ...demoSessions[0]!, status: "Faltou" },
        { ...demoSessions[0]!, status: "Cancelado" },
      ]),
    ).toBe(50);
  });
  it("semana vai de segunda a sábado", () => {
    expect(weekDays("2026-11-20")).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
    ]);
    expect(endTime({ start: "08:30", duration: 50 })).toBe("09:20");
  });
});
