import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useAudit } from "@/hooks/use-audit";
import { useConsents } from "@/hooks/use-consents";
import { canManageConsent } from "@/services/permissions";
import { activeConsent } from "@/services/consent-service";
import { formatDate } from "@/services/student-service";
import { consentPurposes, type ConsentPurpose } from "@/types/consent";
import type { Student } from "@/types/student";

/** Consentimento do responsável legal, por finalidade (LGPD, art. 14: dados de crianças). */
export function ConsentSection({ student }: { student: Student }) {
  const { role } = useAuth();
  const { log } = useAudit();
  const { consents, isLoading, grant, revoke } = useConsents();
  const [guardian, setGuardian] = useState(student.guardian);
  const [error, setError] = useState("");
  const manage = canManageConsent(role);

  async function act(purpose: ConsentPurpose, action: "grant" | "revoke", id?: string) {
    try {
      if (action === "grant") await grant({ studentId: student.id, purpose, guardian });
      else if (id) await revoke(id);
      log(action === "grant" ? "consentiu" : "revogou", "consentimento", student.id, purpose);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o consentimento.");
    }
  }

  return (
    <section className="detail-section no-print" aria-labelledby="consent-heading">
      <h2 id="consent-heading">
        <ShieldCheck /> Consentimento do responsável
      </h2>
      <p className="ai-intro">
        Por ser menor de idade, o tratamento dos dados depende do consentimento do responsável
        legal, registrado por finalidade. A revogação mantém o histórico.
      </p>
      {isLoading ? (
        <p role="status">Carregando consentimentos...</p>
      ) : (
        <ul className="consent-list">
          {consentPurposes.map((purpose) => {
            const current = activeConsent(consents, student.id, purpose.id);
            const revoked = consents
              .filter((c) => c.studentId === student.id && c.purpose === purpose.id && c.revokedOn)
              .at(-1);
            return (
              <li key={purpose.id}>
                <div>
                  <strong>{purpose.label}</strong>
                  <small>{purpose.description}</small>
                  <small>
                    {current
                      ? `Vigente desde ${formatDate(current.grantedOn)} · ${current.guardian} · termo ${current.termVersion}`
                      : revoked?.revokedOn
                        ? `Revogado em ${formatDate(revoked.revokedOn)}`
                        : "Sem consentimento registrado"}
                  </small>
                </div>
                <span className={`status ${current ? "" : "warm"}`}>
                  {current ? "Vigente" : "Pendente"}
                </span>
                {manage ? (
                  current ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void act(purpose.id, "revoke", current.id)}
                    >
                      Revogar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => void act(purpose.id, "grant")}>
                      Registrar
                    </Button>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {manage ? (
        <div className="form-field consent-guardian">
          <label htmlFor="consent-guardian">Responsável que consentiu</label>
          <Input
            id="consent-guardian"
            value={guardian}
            maxLength={120}
            onChange={(e) => setGuardian(e.target.value)}
          />
        </div>
      ) : (
        <p className="report-note">Somente administração e clínica registram consentimentos.</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
