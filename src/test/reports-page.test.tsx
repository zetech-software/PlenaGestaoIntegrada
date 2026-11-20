import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlansProvider } from "@/hooks/use-plans";
import { RecordsProvider } from "@/hooks/use-records";
import { SessionsProvider } from "@/hooks/use-sessions";
import { StudentsProvider } from "@/hooks/use-students";
import { Route } from "@/routes/relatorios";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ role: "admin", assigned: [] }),
}));

afterEach(cleanup);
function renderReports() {
  const Page = Route.options.component as () => React.JSX.Element;
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <StudentsProvider>
        <SessionsProvider>
          <RecordsProvider>
            <PlansProvider>
              <Page />
            </PlansProvider>
          </RecordsProvider>
        </SessionsProvider>
      </StudentsProvider>
    </QueryClientProvider>,
  );
}
describe("página de relatórios", () => {
  it("mostra a frequência por terapeuta e o cabeçalho de impressão com a marca Plena", async () => {
    renderReports();
    await waitFor(() => expect(screen.getAllByText("Marina Duarte").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Rafael Nogueira")[0]).toBeTruthy();
    expect(screen.getAllByText("Plena Gestão Integrada").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Exportar PDF/ })).toBeTruthy();
  });
  it("mostra carregamento e bloqueia a exportação até os dados chegarem", async () => {
    renderReports();
    expect(screen.getByRole("status").textContent).toMatch(/Carregando/);
    expect(
      (screen.getByRole("button", { name: /Exportar PDF/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await waitFor(() => expect(screen.getAllByText("Marina Duarte").length).toBeGreaterThan(0));
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      (screen.getByRole("button", { name: /Exportar PDF/ }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
  it("bloqueia a exportação com período inválido", async () => {
    renderReports();
    await waitFor(() => expect(screen.getAllByText("Marina Duarte").length).toBeGreaterThan(0));
    const to = screen.getByLabelText("Até");
    fireEvent.change(to, { target: { value: "2026-10-01" } });
    expect(screen.getByRole("alert").textContent).toMatch(/anterior/);
    expect(
      (screen.getByRole("button", { name: /Exportar PDF/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
