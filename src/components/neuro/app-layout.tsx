import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sprout,
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  FileText,
  ChartNoAxesCombined,
  Target,
  Settings,
  BookOpen,
  LockKeyhole,
  PanelLeft,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const futureItems = [
  { label: "Anamnese", icon: ClipboardList },
  { label: "Agenda", icon: CalendarDays },
  { label: "Prontuários", icon: FileText },
  { label: "Intervenções", icon: Target },
  { label: "Evolução", icon: ChartNoAxesCombined },
  { label: "Calendário de provas", icon: BookOpen },
  { label: "Relatórios", icon: FileText },
  { label: "Configurações", icon: Settings },
];
export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isStudents = pathname.startsWith("/alunos");
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} aria-label="Menu principal">
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-symbol">
            <Sprout size={24} strokeWidth={1.7} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">
              Plena<span className="text-sand">.</span>
            </span>
            <span className="brand-caption block">Gestão Integrada · Ze Tech</span>
          </span>
        </Link>
        <Button className="mobile-close" variant="ghost" onClick={() => setMobileOpen(false)}>
          <X /> Fechar menu
        </Button>
        <nav>
          <div className="nav-section">
            <div className="nav-label">Seu espaço</div>
            <Link
              to="/"
              className={`nav-item ${!isStudents ? "active" : ""}`}
              aria-current={!isStudents ? "page" : undefined}
              title="Dashboard"
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard />
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link
              to="/alunos"
              className={`nav-item ${isStudents ? "active" : ""}`}
              title="Alunos"
              aria-current={isStudents ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Users />
              <span className="nav-text">Alunos</span>
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-label">Próximas etapas</div>
            {futureItems.map((item) => (
              <div
                className="nav-item future"
                key={item.label}
                aria-disabled="true"
                title={`${item.label} — aguardando validação da primeira entrega`}
              >
                <item.icon />
                <span className="nav-text">{item.label}</span>
                <LockKeyhole className="nav-lock" />
              </div>
            ))}
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-indicator">Versão demonstrativa</div>
          <p>Um novo olhar para cada jornada.</p>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? "Fechar menu" : "Recolher ou expandir menu"}
              title="Recolher ou expandir menu"
              onClick={() => {
                if (window.innerWidth <= 600) setMobileOpen((value) => !value);
                else setCollapsed((value) => !value);
              }}
            >
              <PanelLeft size={18} />
            </Button>
            <span className="topbar-label">{isStudents ? "Alunos" : "Visão geral"}</span>
          </div>
          <div className="topbar-right">
            <form
              className="global-search"
              onSubmit={(event) => {
                event.preventDefault();
                void navigate({ to: "/alunos", search: { q: search } });
              }}
            >
              <Search size={16} />
              <input
                aria-label="Busca global de alunos"
                placeholder="Buscar aluno..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
            <div className="professional">
              <span className="avatar">NP</span>
              <span className="professional-copy">
                <strong>Neuropsicopedagoga</strong>
                <small>Perfil demonstrativo</small>
              </span>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
