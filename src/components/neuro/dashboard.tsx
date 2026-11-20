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
import { useStudents } from "@/hooks/use-students";
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
const appointments = [
  { studentId: "1", time: "08:30", end: "09:20", type: "Atendimento individual", confirmed: true },
  { studentId: "2", time: "10:00", end: "10:50", type: "Atendimento individual", confirmed: true },
  { studentId: "3", time: "14:00", end: "14:50", type: "Encontro inicial", confirmed: true },
  { studentId: "4", time: "15:30", end: "16:20", type: "Atendimento individual", confirmed: false },
];
export function Dashboard() {
  const { students } = useStudents();
  const [month, setMonth] = useState<"Novembro" | "Outubro">("Novembro");
  const active = students.filter((student) => student.status === "Ativo").length;
  const evaluation = students.filter((student) => student.status === "Em avaliação").length;
  const stats = [
    {
      title: "Alunos cadastrados",
      value: students.length,
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
      value: 4,
      icon: CalendarDays,
      tone: "warm",
      foot: "3 confirmados · 1 pendente",
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
      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.title}>
            <div className="stat-top">
              <span>{stat.title}</span>
              <span className={`stat-icon ${stat.tone}`}>
                <stat.icon size={18} strokeWidth={1.7} />
              </span>
            </div>
            <div className="stat-value">{stat.value.toString().padStart(2, "0")}</div>
            <div className="stat-foot">
              {stat.trend ? <ArrowUpRight className="positive" size={13} /> : null}
              <span className={stat.trend ? "positive" : ""}>{stat.foot}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <div>
              <h2>
                Seu dia de atendimentos<span className="count-pill">4 hoje</span>
              </h2>
              <p>Sexta-feira, 20 de novembro de 2026</p>
            </div>
            <Clock3 className="text-muted-foreground" size={17} />
          </div>
          <div className="schedule">
            {appointments.map((appointment) => {
              const student = students.find((item) => item.id === appointment.studentId);
              if (!student) return null;
              return (
                <div className="appointment" key={appointment.time}>
                  <div className="appointment-time">
                    <strong>{appointment.time}</strong>
                    <small>{appointment.end}</small>
                  </div>
                  <div className="appointment-divider" />
                  <StudentAvatar student={student} />
                  <div className="appointment-info">
                    <Link to="/alunos/$id" params={{ id: student.id }}>
                      <strong>{student.name}</strong>
                    </Link>
                    <small>{appointment.type}</small>
                  </div>
                  <span className={`status ${appointment.confirmed ? "" : "warm"}`}>
                    {appointment.confirmed ? "Confirmado" : "Pendente"}
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
        <StudentTable students={students.slice(0, 4)} />
      </section>
      <DemoFooter />
    </main>
  );
}
