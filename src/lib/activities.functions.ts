import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVITY_INSTRUCTIONS,
  buildActivityPrompt,
  validateActivityRequest,
  type ActivityRequest,
} from "@/services/activity-prompt";

export type ActivitySuggestionResult =
  { text: string; error?: undefined } | { text?: undefined; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const suggestActivities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ActivityRequest & { studentId: string }) => ({
    studentId: String(input.studentId ?? "").slice(0, 64),
    studentFirstName: String(input.studentFirstName ?? "").slice(0, 60),
    age: Number(input.age) || 0,
    grade: String(input.grade ?? "").slice(0, 60),
    observations: String(input.observations ?? ""),
    goals: String(input.goals ?? ""),
  }))
  .handler(async ({ data, context }): Promise<ActivitySuggestionResult> => {
    // Students stored in the database (uuid ids) need an active "ia" consent checked
    // server-side; legacy in-memory demo ids carry only fictitious data.
    if (UUID.test(data.studentId)) {
      const { data: ok, error } = await context.supabase.rpc("has_active_consent", {
        _student_id: data.studentId,
        _purpose: "ia",
      });
      if (error || !ok)
        return { error: "Sem consentimento vigente do responsável para uso de IA com este aluno." };
    } else if (!data.studentId) {
      return { error: "Aluno não informado." };
    }
    const invalid = validateActivityRequest(data);
    if (invalid) return { error: invalid };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { error: "O serviço de IA não está configurado." };
    try {
      const { generateGatewayText } = await import("./ai/gateway.server");
      const text = await generateGatewayText(
        apiKey,
        ACTIVITY_INSTRUCTIONS,
        buildActivityPrompt(data),
      );
      if (!text.trim()) return { error: "Não foi possível gerar sugestões para esta descrição." };
      return { text };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      console.error("suggestActivities failed", status, error);
      if (status === 402)
        return {
          error: "Os créditos de IA acabaram. Adicione créditos em Settings → Plans & credits.",
        };
      if (status === 429)
        return { error: "Muitas solicitações no momento. Aguarde um pouco e tente de novo." };
      if (status === 403)
        return { error: "O acesso ao modelo de IA foi negado para esta solicitação." };
      return { error: "Não foi possível gerar as sugestões agora. Tente novamente em instantes." };
    }
  });
