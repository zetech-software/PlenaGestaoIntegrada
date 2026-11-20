import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestActivities } from "@/lib/activities.functions";
import { useConsents } from "@/hooks/use-consents";
import { hasConsent } from "@/services/consent-service";
import { validateActivityRequest } from "@/services/activity-prompt";
import { studentAge } from "@/services/student-service";
import type { Student } from "@/types/student";

function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

function SuggestionText({ text }: { text: string }) {
  return (
    <div className="ai-result">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("#")) return <h3 key={i}>{t.replace(/^#+\s*/, "")}</h3>;
        if (/^[-*]\s/.test(t))
          return (
            <p key={i} className="ai-bullet">
              {renderInline(t.slice(2))}
            </p>
          );
        return <p key={i}>{renderInline(t)}</p>;
      })}
    </div>
  );
}

export function ActivitySuggestions({ student }: { student: Student }) {
  const suggest = useServerFn(suggestActivities);
  const { consents, isLoading: consentsLoading } = useConsents();
  const allowed = hasConsent(consents, student.id, "ia");
  const [observations, setObservations] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!allowed) return setError("Registre o consentimento do responsável para usar a IA.");
    const request = {
      studentFirstName: student.name.split(" ")[0] ?? "",
      age: studentAge(student.birthDate),
      grade: student.grade,
      observations,
      goals,
    };
    const invalid = validateActivityRequest(request);
    if (invalid) return setError(invalid);
    setError(null);
    setLoading(true);
    try {
      const response = await suggest({ data: { ...request, studentId: student.id } });
      if (response.error) setError(response.error);
      else setResult(response.text ?? "");
    } catch {
      setError("Não foi possível gerar as sugestões agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="detail-section ai-section no-print">
      <h2>
        <Sparkles /> Sugestões de atividades com IA
      </h2>
      <p className="ai-intro">
        Descreva suas observações e os objetivos de acompanhamento. A IA sugere atividades
        personalizadas; ela não faz diagnósticos e a decisão é sempre sua.
      </p>
      {!consentsLoading && !allowed ? (
        <p className="ai-error" role="alert">
          Sem consentimento vigente do responsável para o uso de IA. Registre-o em "Consentimento do
          responsável" acima para liberar as sugestões.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="ai-form">
        <div className="form-field">
          <label htmlFor="ai-observations">Observações</label>
          <Textarea
            id="ai-observations"
            rows={4}
            maxLength={2000}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex.: mantém atenção por cerca de 10 minutos, gosta de jogos de tabuleiro, evita leitura em voz alta."
          />
        </div>
        <div className="form-field">
          <label htmlFor="ai-goals">Objetivos</label>
          <Textarea
            id="ai-goals"
            rows={3}
            maxLength={2000}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Ex.: ampliar o tempo de atenção e ganhar confiança na leitura."
          />
        </div>
        {error && (
          <p className="ai-error" role="alert">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={loading || consentsLoading || !allowed}>
            {loading ? <Loader2 className="animate-spin" /> : <Lightbulb />}
            {loading
              ? "Gerando sugestões..."
              : result
                ? "Gerar novas sugestões"
                : "Sugerir atividades"}
          </Button>
        </div>
      </form>
      {result && <SuggestionText text={result} />}
    </section>
  );
}
