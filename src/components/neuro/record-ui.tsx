import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Evolution } from "@/types/record";

export function BackToProfile({ id }: { id: string }) {
  return (
    <Link to="/alunos/$id" params={{ id }} className="back-link">
      <ArrowLeft size={14} /> Voltar para o perfil
    </Link>
  );
}
export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="form-field full">
      <label htmlFor={id}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      <Textarea
        id={id}
        className="bg-card"
        rows={3}
        value={value}
        placeholder={hint}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
const tone: Record<Evolution, string> = {
  Avançou: "",
  Estável: "info",
  "Precisa de atenção": "warm",
};
export function EvolutionBadge({ value }: { value: Evolution }) {
  return <span className={`status ${tone[value]}`}>{value}</span>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
