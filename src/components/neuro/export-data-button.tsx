import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAudit } from "@/hooks/use-audit";
import { useConsents } from "@/hooks/use-consents";
import { usePlans } from "@/hooks/use-plans";
import { useRecords } from "@/hooks/use-records";
import { useSessions } from "@/hooks/use-sessions";
import { canExportStudent } from "@/services/permissions";
import { buildStudentExport, exportFileName } from "@/services/export-service";
import type { Student } from "@/types/student";

/** Baixa todos os dados do aluno em JSON (acesso e portabilidade, LGPD). Só admin e clínica. */
export function ExportDataButton({ student }: { student: Student }) {
  const { role } = useAuth();
  const { log } = useAudit();
  const { anamneses, records, isLoading: recordsLoading } = useRecords();
  const { sessions, isLoading: sessionsLoading } = useSessions();
  const { plans, isLoading: plansLoading } = usePlans();
  const { consents, isLoading: consentsLoading } = useConsents();
  const [error, setError] = useState("");
  if (!canExportStudent(role)) return null;
  const loading = recordsLoading || sessionsLoading || plansLoading || consentsLoading;

  function download() {
    try {
      const data = buildStudentExport({
        student,
        anamnesis: anamneses.find((a) => a.studentId === student.id),
        records,
        sessions,
        plans,
        consents,
        exportedAt: new Date().toISOString(),
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName(student);
      link.click();
      URL.revokeObjectURL(url);
      log("exportou", "dados do aluno", student.id, "JSON");
      setError("");
    } catch {
      setError("Não foi possível exportar os dados.");
    }
  }

  return (
    <>
      <Button variant="outline" disabled={loading} onClick={download}>
        <Download /> Exportar dados (JSON)
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      ) : null}
    </>
  );
}
