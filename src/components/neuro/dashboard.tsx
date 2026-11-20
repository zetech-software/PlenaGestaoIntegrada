import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Sun,
  Clock3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/use-students";
import { useSessions } from "@/hooks/use-sessions";
import { endTime, sessionsOn } from "@/services/session-service";
import { demoDate } from "@/data/demo-students";
import { StudentAvatar, StudentTable, DemoFooter } from "./student-ui";

const monthData = {
  Novembro: [
    { week: "01–07", done: 10, planned: 2 },
    { week: "08–14", done: 14, planned: 2 },
    { week: "15–21", done: 12, planned: 3 },
    { week: "22–28", done: 12, planned: 4 },
  ],
  Outubro: [
    { week: "01–07", done: 8, planned: 3 },
    { week: "08–14", done: 11, planned: 2 },
    { week: "15–21", done: 9, planned: 3 },
    { week: "22–31", done: 12, planned: 2 },
  ],
};
export function Dashboard() {
  const { students, isLoading } = useStudents();
  const { sessions } = useSessions();
  const appointments = sessionsOn(sessions, demoDate).filter((x) => x.status !== "Cancelado");
  const confirmed = appointments.filter(
    (x) => x.status === "Confirmado" || x.status === "Realizado",
  ).length;
  const [month, setMonth] = useState<"Novembro" | "Outubro">("Novembro");
  const active = students.filter((student) => student.status === "Ativo").length;
  const evaluation = students.filter((student) => student.status === "Em avaliação").length;
  const stats = [
    {
      title: "Alunos cadastrados",
      value: students.length,
      loading: isLoading,
      icon: Users,
      tone: "",
      foot: `${active} alunos ativos`,
      trend: false,
    },
    {
      title: "Atendimentos no mês",
      value: 48,
      icon: CalendarCheck,
      tone: "info",
      foot: "8 a mais que em outubro",
      trend: true,
    },
    {
      title: "Atendimentos hoje",
      value: appointments.length,
      icon: CalendarDays,
      tone: "warm",
      foot: `${confirmed} confirmados · ${appointments.length - confirmed} pendentes`,
      trend: false,
    },
    {
      title: "Em avaliação",
      value: evaluation,
      icon: ClipboardList,
      tone: "",
      foot: "Cada começo, uma possibilidade",
      trend: false,
    },
  ];
  const chartData = monthData[month];
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sun size={15} /> SEXTA-FEIRA, 20 DE NOVEMBRO
          </div>
          <h1>Olá, seja bem-vinda!</h1>
          <p>Um novo dia para cuidar de histórias e construir possibilidades.</p>
        </div>
        <div className="heading-actions">
          <span className="date-label">
            <CalendarDays size={14} /> 20 nov. 2026
          </span>
          <Button asChild>
            <Link to="/alunos/novo">
              <Plus /> Novo aluno
            </Link>
          </Button>
        </div>
      </div>
      <div className="stats-grid" aria-busy={isLoading}>
        {stats.map((stat) => (
          <article className="stat-card" key={stat.title}>
            <div className="stat-top">
              <span>{stat.title}</span>
              <span className={`stat-icon ${stat.tone}`}>
                <stat.icon size={18} strokeWidth={1.7} />
              </span>
            </div>
            {"loading" in stat && stat.loading ? (
              <>
                <Skeleton className="my-1 h-9 w-16" role="status" aria-label="Carregando" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="stat-value">{stat.value.toString().padStart(2, "0")}</div>
                <div className="stat-foot">
                  {stat.trend ? <ArrowUpRight className="positive" size={13} /> : null}
                  <span className={stat.trend ? "positive" : ""}>{stat.foot}</span>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <div>
              <h2>
                Seu dia de atendimentos
                <span className="count-pill">{appointments.length} hoje</span>
              </h2>
              <p>Sexta-feira, 20 de novembro de 2026</p>
            </div>
            <Clock3 className="text-muted-foreground" size={17} />
          </div>
          <div className="schedule" aria-busy={isLoading}>
            {isLoading ? <p role="status">Carregando atendimentos...</p> : null}
            {(isLoading ? [] : appointments).map((appointment) => {
              const student = students.find((item) => item.id === appointment.studentId);
              if (!student) return null;
              return (
                <div className="appointment" key={appointment.id}>
                  <div className="appointment-time">
                    <strong>{appointment.start}</strong>
                    <small>{endTime(appointment)}</small>
                  </div>
                  <div className="appointment-divider" />
                  <StudentAvatar student={student} />
                  <div className="appointment-info">
                    <Link to="/alunos/$id" params={{ id: student.id }}>
                      <strong>{student.name}</strong>
                    </Link>
                    <small>{appointment.type}</small>
                  </div>
                  <span className={`status ${appointment.status === "Pendente" ? "warm" : ""}`}>
                    {appointment.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <div>
              <h2>Atendimentos no mês</h2>
              <p>Um olhar sobre a sua rotina</p>
            </div>
            <Select
              value={month}
              onValueChange={(value) => {
                if (value === "Novembro" || value === "Outubro") setMonth(value);
              }}
            >
              <SelectTrigger className="w-28 bg-card" aria-label="Mês dos atendimentos">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Novembro">Novembro</SelectItem>
                <SelectItem value="Outubro">Outubro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="chart-area">
            <div className="chart-summary">
              <strong>{chartData.reduce((sum, item) => sum + item.done, 0)}</strong>
              <span>atendimentos realizados</span>
            </div>
            <div
              className="chart"
              role="img"
              aria-label={`Gráfico demonstrativo de atendimentos em ${month}: ${chartData.map((item) => `${item.week}: ${item.done} realizados e ${item.planned} previstos`).join("; ")}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barSize={22}
                  margin={{ top: 8, right: 0, bottom: 0, left: -28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dy={7}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    ticks={[0, 5, 10, 15, 20]}
                    domain={[0, 20]}
                  />
                  <Tooltip cursor={{ fill: "var(--muted)" }} />
                  <Bar
                    name="Realizados"
                    dataKey="done"
                    fill="var(--primary)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    name="Previstos"
                    dataKey="planned"
                    fill="var(--secondary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-footer">
              <span className="legend">Realizados</span>
              <span className="legend light">Previstos</span>
              <span>Dados demonstrativos</span>
            </div>
          </div>
        </section>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <h2>Seus alunos</h2>
            <p>Cada aluno, uma jornada única.</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/alunos">
              Ver todos os alunos <ArrowRight />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <p role="status" aria-busy="true">
            Carregando alunos...
          </p>
        ) : (
          <StudentTable students={students.slice(0, 4)} />
        )}
      </section>
      <DemoFooter />
    </main>
  );
}
