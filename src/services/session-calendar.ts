import { shiftDate, toMinutes } from "@/services/session-service";
import type { Session } from "@/types/session";

export const DEFAULT_SESSION_DURATION = 45;

/** Local wall-clock dates, independent of the browser's timezone. */
export function calendarSessionTimes(session: Pick<Session, "date" | "start" | "duration">) {
  const minutes = toMinutes(session.start) + session.duration;
  const endDate = shiftDate(session.date, Math.floor(minutes / 1440));
  const time = minutes % 1440;
  return {
    start: `${session.date}T${session.start}:00`,
    end: `${endDate}T${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}:00`,
  };
}