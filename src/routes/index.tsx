import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/neuro/dashboard";
import { TherapistDashboard } from "@/components/neuro/therapist-dashboard";
import { useAuth } from "@/hooks/use-auth";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Painel da Plena Gestão Integrada com agenda e alunos vinculados para acompanhamento profissional.",
      },
      { property: "og:title", content: "Dashboard | Plena Gestão Integrada" },
      {
        property: "og:description",
        content:
          "Agenda e alunos vinculados para acompanhar desenvolvimento, aprendizagem e cuidado. Dados demonstrativos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { role } = useAuth();
  return role === "terapeuta" ? <TherapistDashboard /> : <Dashboard />;
}
