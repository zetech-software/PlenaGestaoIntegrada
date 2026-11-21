import { describe, expect, it } from "vitest";
import { calendarSessionTimes, DEFAULT_SESSION_DURATION } from "@/services/session-calendar";
import { demoSessions } from "@/data/demo-sessions";

describe("horários do calendário", () => {
  it("usa 45 minutos como duração habitual dos atendimentos", () => {
    expect(DEFAULT_SESSION_DURATION).toBe(45);
    expect(demoSessions.every((session) => session.duration === 45)).toBe(true);
    expect(calendarSessionTimes({ date: "2026-11-20", start: "09:00", duration: DEFAULT_SESSION_DURATION })).toEqual({
      start: "2026-11-20T09:00:00", end: "2026-11-20T09:45:00",
    });
  });
  it("respeita uma duração ajustada pelo profissional", () => {
    expect(calendarSessionTimes({ date: "2026-11-20", start: "10:30", duration: 60 }).end).toBe("2026-11-20T11:30:00");
  });
  it("leva o fim da sessão para o próximo dia quando necessário", () => {
    expect(calendarSessionTimes({ date: "2026-11-20", start: "23:30", duration: 45 }).end).toBe("2026-11-21T00:15:00");
  });
});