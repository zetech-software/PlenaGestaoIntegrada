import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sprout,
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  FileText,
  Target,
  Settings,
  BookOpen,
  LockKeyhole,
  PanelLeft,
  Search,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
const futureItems = [
  { label: "Intervenções", icon: Target },
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
  const isStudents = pathname.startsWith("/alunos") && !/\/(anamnese|prontuario)$/.test(pathname);
  const isAgenda = pathname.startsWith("/agenda");
  const isRecords = pathname.startsWith("/prontuarios") || /\/alunos\/[^/]+\/(anamnese|prontuario)/.test(pathname);
  const { session, signOut } = useAuth();
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
              className={`nav-item ${!isStudents && !isAgenda && !isRecords ? "active" : ""}`}
              aria-current={!isStudents && !isAgenda && !isRecords ? "page" : undefined}
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
            <Link
              to="/agenda"
              className={`nav-item ${isAgenda ? "active" : ""}`}
              title="Agenda"
              aria-current={isAgenda ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <CalendarDays />
              <span className="nav-text">Agenda</span>
            </Link>
            <Link
              to="/prontuarios"
              className={`nav-item ${isRecords ? "active" : ""}`}
              title="Prontuários"
              aria-current={isRecords ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <ClipboardList />
              <span className="nav-text">Prontuários</span>
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
            <span className="topbar-label">{isStudents ? "Alunos" : isAgenda ? "Agenda" : isRecords ? "Prontuários" : "Visão geral"}</span>
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
                <small>{session?.user.email ?? "Perfil demonstrativo"}</small>
              </span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sair" title="Sair" onClick={() => void signOut()}>
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
