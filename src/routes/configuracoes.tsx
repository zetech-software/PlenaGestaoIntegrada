import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracoes")({
  component: SettingsLayout,
});

const tabs = [
  { to: "/configuracoes", label: "Cadastro da clínica", exact: true },
  { to: "/configuracoes/logo", label: "Logo", exact: false },
  { to: "/configuracoes/assinatura", label: "Assinatura", exact: false },
] as const;

function SettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os dados e a identidade da sua clínica.</p>
      </div>
      <nav className="flex gap-2 border-b" aria-label="Seções de configurações">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.exact }}
            className="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "border-primary text-primary" }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
