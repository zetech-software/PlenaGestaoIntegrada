import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlenaMark } from "@/components/neuro/plena-logo";
import { useBrandLogo } from "@/hooks/use-brand";

export const Route = createFileRoute("/configuracoes/logo")({
  head: () => ({
    meta: [
      { title: "Logo da clínica | Plena Gestão Integrada" },
      { name: "description", content: "Personalize a logo da clínica na Plena Gestão Integrada." },
      { property: "og:title", content: "Logo da clínica | Plena Gestão Integrada" },
      { property: "og:description", content: "Personalize a logo da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogoPage,
});

function LogoPage() {
  const { logo, save } = useBrandLogo();
  const [error, setError] = useState("");
  const onFile = (file?: File) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Escolha um arquivo de imagem.");
    if (file.size > 500_000) return setError("A imagem deve ter até 500 KB.");
    const reader = new FileReader();
    reader.onload = () => save(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <section className="max-w-xl space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Logo da clínica</h2>
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt="Logo atual" className="h-16 w-16 rounded-xl border object-contain" />
        ) : (
          <PlenaMark size={64} />
        )}
        <p className="text-sm text-muted-foreground">
          {logo ? "Logo personalizada em uso." : "Logo padrão da Plena em uso."}
        </p>
      </div>
      <label className="block text-sm font-medium text-foreground">
        Enviar nova logo (PNG, JPG ou SVG, até 500 KB)
        <input type="file" accept="image/*" className="mt-2 block text-sm" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {logo && (
        <Button variant="outline" onClick={() => save(null)}>
          Voltar para a logo padrão
        </Button>
      )}
    </section>
  );
}
