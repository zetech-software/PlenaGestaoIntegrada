import { PlenaMark } from "@/components/neuro/plena-logo";
import { useBrandLogo } from "@/hooks/use-brand";
import { formatDate } from "@/services/student-service";
import { demoDate } from "@/data/demo-students";

/** Logo da clínica (Configurações) ou, na falta dela, o símbolo padrão da Plena. */
export function PrintBrandMark() {
  const { logo } = useBrandLogo();
  return logo ? (
    <img src={logo} alt="" className="h-9 w-9 rounded-xl object-contain" />
  ) : (
    <PlenaMark size={36} />
  );
}
/** Cabeçalho da exportação em PDF (só aparece na impressão), com a marca Plena. */
export function PrintHeader({ title, detail }: { title: string; detail?: string | undefined }) {
  return (
    <div className="print-header" aria-hidden="true">
      <PrintBrandMark />
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
