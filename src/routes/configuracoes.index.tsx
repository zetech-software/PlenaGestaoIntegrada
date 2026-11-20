import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useClinic, type ClinicInfo } from "@/hooks/use-clinic";

export const Route = createFileRoute("/configuracoes/")({
  head: () => ({
    meta: [
      { title: "Cadastro da clínica | Plena Gestão Integrada" },
      { name: "description", content: "Cadastre os dados da clínica na Plena Gestão Integrada." },
      { property: "og:title", content: "Cadastro da clínica | Plena Gestão Integrada" },
      { property: "og:description", content: "Dados cadastrais da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClinicPage,
});

const fields: { key: keyof ClinicInfo; label: string; type?: string }[] = [
  { key: "name", label: "Nome da clínica *" },
  { key: "document", label: "CNPJ / CPF" },
  { key: "responsible", label: "Responsável técnico" },
  { key: "phone", label: "Telefone", type: "tel" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Cidade / UF" },
];

function ClinicPage() {
  const { clinic, save } = useClinic();
  const [form, setForm] = useState(clinic);
  const [msg, setMsg] = useState("");
  useEffect(() => setForm(clinic), [clinic]);
  return (
    <form
      className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.name.trim().length < 2) return setMsg("Informe o nome da clínica.");
        save(form);
        setMsg("Dados da clínica salvos.");
      }}
    >
      <h2 className="text-lg font-semibold text-foreground">Cadastro da clínica</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm font-medium text-foreground">
            {f.label}
            <input
              type={f.type ?? "text"}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <Button type="submit">Salvar dados</Button>
    </form>
  );
}
