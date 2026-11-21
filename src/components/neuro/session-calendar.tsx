import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarSessionTimes } from "@/services/session-calendar";
import { endTime } from "@/services/session-service";
import { demoTherapists } from "@/data/demo-therapists";
import type { Session } from "@/types/session";
import type { Student } from "@/types/student";

const views = [
  { id: "timeGridDay", label: "Dia" },
  { id: "timeGridWeek", label: "Semana" },
  { id: "dayGridMonth", label: "Mês" },
] as const;

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

interface Props {
  sessions: Session[];
  students: Student[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNewSession: (date: string, time: string) => void;
  onSelectSession: (id: string) => void;
}

export default function SessionCalendar({ sessions, students, selectedDate, onDateChange, onNewSession, onSelectSession }: Props) {
  const calendar = useRef<FullCalendar>(null);
  const [view, setView] = useState("timeGridWeek");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      calendar.current?.getApi().changeView("timeGridDay");
    }
  }, []);

  useEffect(() => {
    const api = calendar.current?.getApi();
    if (api && dateKey(api.getDate()) !== selectedDate) api.gotoDate(selectedDate);
  }, [selectedDate]);

  const events = sessions.flatMap((session) => {
    const student = students.find((item) => item.id === session.studentId);
    if (!student) return [];
    return [{
      id: session.id,
      title: student.name,
      ...calendarSessionTimes(session),
      classNames: [`session-event-${session.status.toLowerCase()}`],
      extendedProps: {
        session,
        therapist: demoTherapists.find((item) => item.id === session.therapistId)?.name ?? "",
      },
    }];
  });

  return (
    <section className="session-calendar" aria-label="Calendário de atendimentos">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <Button variant="outline" size="sm" onClick={() => calendar.current?.getApi().today()}>Hoje</Button>
          <Button variant="ghost" size="icon" aria-label="Período anterior" title="Período anterior" onClick={() => calendar.current?.getApi().prev()}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Próximo período" title="Próximo período" onClick={() => calendar.current?.getApi().next()}><ChevronRight /></Button>
          <h2 aria-live="polite">{title}</h2>
        </div>
        <div className="calendar-views" role="group" aria-label="Visualização do calendário">
          {views.map((item) => (
            <Button key={item.id} size="sm" variant={view === item.id ? "secondary" : "ghost"} aria-pressed={view === item.id} onClick={() => calendar.current?.getApi().changeView(item.id)}>{item.label}</Button>
          ))}
        </div>
      </div>
      <div className={`calendar-grid calendar-view-${view}`}>
        <FullCalendar
          ref={calendar}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="timeGridWeek"
          initialDate={selectedDate}
          firstDay={1}
          headerToolbar={false}
          height={650}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          scrollTimeReset={false}
          slotDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayHeaderFormat={view === "dayGridMonth" ? { weekday: "short" } : { weekday: "short", day: "2-digit" }}
          nowIndicator
          eventMinHeight={42}
          expandRows
          dayMaxEvents={3}
          events={events}
          datesSet={(info) => {
            setTitle(info.view.title);
            setView(info.view.type);
            onDateChange(dateKey(info.view.calendar.getDate()));
          }}
          dateClick={(info) => onNewSession(info.dateStr.slice(0, 10), info.allDay ? "09:00" : info.dateStr.slice(11, 16))}
          eventContent={(info) => {
            const session = info.event.extendedProps['session'] as Session;
            return (
              <Button variant="ghost" className="calendar-event-content h-full w-full min-h-0 items-start justify-start rounded-none text-inherit hover:bg-transparent hover:text-inherit" aria-label={`${info.event.title}, ${session.start}–${endTime(session)}, ${session.status}`} title={`${session.type} · ${session.duration} min · ${session.status}`} onClick={() => onSelectSession(info.event.id)}>
                <span className="calendar-event-time">{session.start}–{endTime(session)}</span>
                <strong>{info.event.title}</strong>
                {view === "timeGridDay" ? <small>{String(info.event.extendedProps['therapist'])} · {session.status}</small> : null}
              </Button>
            );
          }}
        />
      </div>
      <div className="calendar-legend" aria-label="Status das sessões">
        <span className="legend-confirmado">Confirmado</span>
        <span className="legend-pendente">Pendente</span>
        <span className="legend-realizado">Realizado</span>
        <span className="legend-faltou">Faltou</span>
        <span className="legend-cancelado">Cancelado</span>
      </div>
    </section>
  );
}