import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
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
  ShieldCheck,
  ScrollText,
  Wallet,
  Building2,
} from "lucide-react";
import { areaForPath, canAccess, roleLabels } from "@/services/permissions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlenaMark } from "@/components/neuro/plena-logo";
import { useBrandLogo } from "@/hooks/use-brand";
const futureItems = [{ label: "Calendário de provas", icon: BookOpen }];
export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isStudents = pathname.startsWith("/alunos") && !/\/(anamnese|prontuario)$/.test(pathname);
  const isAgenda = pathname.startsWith("/agenda");
  const isRecords =
    pathname.startsWith("/prontuarios") || /\/alunos\/[^/]+\/(anamnese|prontuario)/.test(pathname);
  const { session, signOut, role } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [accountError, setAccountError] = useState("");
  async function switchAccount() {
    setSwitching(true);
    setAccountError("");
    try {
      await signOut();
    } catch {
      setAccountError("Não foi possível sair. Tente novamente.");
      setSwitching(false);
    }
  }
  const isUsers = pathname.startsWith("/usuarios");
  const isPlans = pathname.startsWith("/intervencoes");
  const isReports = pathname.startsWith("/relatorios");
  const isAudit = pathname.startsWith("/auditoria");
  const isFinance = pathname.startsWith("/financeiro");
  const isPlatform = pathname.startsWith("/plataforma");
  const isDashboard =
    !isStudents &&
    !isAgenda &&
    !isRecords &&
    !isUsers &&
    !isPlans &&
    !isReports &&
    !isAudit &&
    !isFinance &&
    !isPlatform &&
    !pathname.startsWith("/configuracoes");
  const { logo } = useBrandLogo();
  const isSettings = pathname.startsWith("/configuracoes");
  const allowed = canAccess(role, areaForPath(pathname));
  // O operador da plataforma só tem o painel dele: qualquer outra página leva para lá.
  useEffect(() => {
    if (role === "plataforma" && !allowed) void navigate({ to: "/plataforma", replace: true });
  }, [role, allowed, navigate]);
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} aria-label="Menu principal">
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          {logo ? (
            <img src={logo} alt="Logo da clínica" className="h-10 w-10 rounded-xl object-contain" />
          ) : (
            <PlenaMark size={42} />
          )}
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
            <div className="nav-label">{role === "plataforma" ? "Plataforma" : "Seu espaço"}</div>
            {role !== "plataforma" ? (
              <>
                <Link
                  to="/"
                  className={`nav-item ${isDashboard ? "active" : ""}`}
                  aria-current={isDashboard ? "page" : undefined}
                  title={role === "terapeuta" ? "Meu painel" : "Dashboard"}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard />
                  <span className="nav-text">{role === "terapeuta" ? "Meu painel" : "Dashboard"}</span>
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
                <Link
                  to="/intervencoes"
                  className={`nav-item ${isPlans ? "active" : ""}`}
                  title="Intervenções"
                  aria-current={isPlans ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <Target />
                  <span className="nav-text">Intervenções</span>
                </Link>
                <Link
                  to="/relatorios"
                  className={`nav-item ${isReports ? "active" : ""}`}
                  title="Relatórios"
                  aria-current={isReports ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <FileText />
                  <span className="nav-text">Relatórios</span>
                </Link>
              </>
            ) : null}
            {canAccess(role, "plataforma") ? (
              <Link
                to="/plataforma"
                className={`nav-item ${isPlatform ? "active" : ""}`}
                title="Plataforma"
                aria-current={isPlatform ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Building2 />
                <span className="nav-text">Clientes</span>
              </Link>
            ) : null}
            {canAccess(role, "financeiro") ? (
              <Link
                to="/financeiro"
                className={`nav-item ${isFinance ? "active" : ""}`}
                title="Financeiro"
                aria-current={isFinance ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Wallet />
                <span className="nav-text">Financeiro</span>
              </Link>
            ) : null}
            {canAccess(role, "auditoria") ? (
              <Link
                to="/auditoria"
                className={`nav-item ${isAudit ? "active" : ""}`}
                title="Auditoria"
                aria-current={isAudit ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <ScrollText />
                <span className="nav-text">Auditoria</span>
              </Link>
            ) : null}
            {canAccess(role, "usuarios") ? (
              <Link
                to="/usuarios"
                className={`nav-item ${isUsers ? "active" : ""}`}
                title="Usuários"
                aria-current={isUsers ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck />
                <span className="nav-text">Usuários</span>
              </Link>
            ) : null}
          </div>
          {role !== "plataforma" ? (
            <div className="nav-section">
              <div className="nav-label">Próximas etapas</div>
              {canAccess(role, "configuracoes") && (
                <Link
                  to="/configuracoes"
                  className={`nav-item ${isSettings ? "active" : ""}`}
                  title="Configurações"
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings />
                  <span className="nav-text">Configurações</span>
                </Link>
              )}
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
          ) : null}
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
            <span className="topbar-label">
              {isStudents
                ? "Alunos"
                : isAgenda
                  ? "Agenda"
                  : isRecords
                    ? "Prontuários"
                    : isPlans
                      ? "Intervenções"
                      : isReports
                        ? "Relatórios"
                        : isPlatform
                          ? "Plataforma"
                          : isFinance
                            ? "Financeiro"
                            : isAudit
                              ? "Auditoria"
                              : isUsers
                                ? "Usuários"
                                : isSettings
                                  ? "Configurações"
                                  : role === "terapeuta" ? "Meu painel" : "Visão geral"}
            </span>
          </div>
          <div className="topbar-right">
            {role !== "plataforma" ? (
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
            ) : null}
            <div className="professional" aria-label="Conta conectada">
              <span className="avatar">
                {role ? roleLabels[role].slice(0, 2).toUpperCase() : "NP"}
              </span>
              <span className="professional-copy">
                <strong>{role ? roleLabels[role] : "Sem perfil"}</strong>
                <small>{session?.user.email ?? "E-mail indisponível"}</small>
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              title="Sair"
              disabled={switching}
              onClick={() => void switchAccount()}
            >
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        {allowed ? (
          children
        ) : (
          <main className="page no-access">
            <h1>Sem acesso a esta área</h1>
            <p className="text-muted-foreground mt-2">
              {role
                ? "Seu perfil não permite abrir esta página."
                : "Sua conta ainda não tem um perfil. Peça a um administrador."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/">Ir para meu painel</Link>
              </Button>
              <Button disabled={switching} onClick={() => void switchAccount()}>
                <LogOut size={16} /> {switching ? "Saindo..." : "Sair e entrar com outra conta"}
              </Button>
            </div>
          </main>
        )}
        {accountError ? <p role="alert" className="px-6 py-3 text-destructive">{accountError}</p> : null}
      </div>
    </div>
  );
}
