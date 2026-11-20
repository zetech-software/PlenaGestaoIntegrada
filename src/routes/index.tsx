import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/neuro/dashboard";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Visão geral demonstrativa dos alunos e atendimentos da Plena Gestão Integrada.",
      },
      { property: "og:title", content: "Dashboard | Plena Gestão Integrada" },
      {
        property: "og:description",
        content:
          "Um olhar organizado para a gestão neuropsicopedagógica. Dados exclusivamente fictícios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
