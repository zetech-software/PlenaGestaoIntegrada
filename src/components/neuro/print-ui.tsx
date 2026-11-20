import { Sprout } from "lucide-react";
import { formatDate } from "@/services/student-service";
import { demoDate } from "@/data/demo-students";

/** Cabeçalho da exportação em PDF (só aparece na impressão), com a marca Plena. */
export function PrintHeader({ title, detail }: { title: string; detail?: string | undefined }) {
  return (
    <div className="print-header" aria-hidden="true">
      <span className="brand-symbol">
        <Sprout size={22} strokeWidth={1.7} />
      </span>
      <div>
        <strong>Plena Gestão Integrada</strong>
        <small>
          {title}
          {detail ? ` · ${detail}` : ""} · por Ze Tech
        </small>
      </div>
      <span className="print-date">Emitido em {formatDate(demoDate)}</span>
    </div>
  );
}
export function PrintFooter() {
  return (
    <p className="print-footer">
      Plena Gestão Integrada · Documento demonstrativo com dados fictícios.
    </p>
  );
}
