import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createRateLimiter, decideAiAccess, isUuid, waitMessage } from "@/services/ai-access";
import {
  ACTIVITY_INSTRUCTIONS,
  ACTIVITY_LIMITS,
  buildActivityPrompt,
  validateActivityRequest,
  type ActivityRequest,
} from "@/services/activity-prompt";

export type ActivitySuggestionResult =
  { text: string; error?: undefined } | { text?: undefined; error: string };

// Limites por janela de 10 minutos (melhor esforço, por instância do servidor).
const WINDOW_MS = 10 * 60_000;
const perUser = createRateLimiter(20, WINDOW_MS);
const perTenant = createRateLimiter(100, WINDOW_MS);
const MAX_TEXT = ACTIVITY_LIMITS.max + 1; // um a mais, para a validação recusar em vez de truncar

export const suggestActivities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ActivityRequest & { studentId: string }) => ({
    studentId: String(input.studentId ?? "").slice(0, 64),
    studentFirstName: String(input.studentFirstName ?? "").slice(0, 60),
    age: Math.min(120, Math.max(0, Math.trunc(Number(input.age)) || 0)),
    grade: String(input.grade ?? "").slice(0, 60),
    observations: String(input.observations ?? "").slice(0, MAX_TEXT),
    goals: String(input.goals ?? "").slice(0, MAX_TEXT),
  }))
  .handler(async ({ data, context }): Promise<ActivitySuggestionResult> => {
    // 1) Quem pode: usuário de uma clínica ativa (não vale conta solta nem operador da plataforma).
    const [{ data: tenantId }, { data: tenantActive }] = await Promise.all([
      context.supabase.rpc("current_tenant_id"),
      context.supabase.rpc("tenant_is_active"),
    ]);
    // 2) Aluno do banco: consentimento de IA conferido no servidor. Aluno em memória: só com a chave.
    const consent = isUuid(data.studentId)
      ? await context.supabase.rpc("has_active_consent", {
          _student_id: data.studentId,
          _purpose: "ia",
        })
      : null;
    const access = decideAiAccess({
      tenantId: tenantId ?? null,
      tenantActive: tenantActive === true,
      studentId: data.studentId,
      consentOk: consent !== null && !consent.error && consent.data === true,
      allowDemoStudents: process.env["AI_ALLOW_DEMO_STUDENTS"] === "true",
    });
    if (!access.ok) return { error: access.error };
    const invalid = validateActivityRequest(data);
    if (invalid) return { error: invalid };
    // 3) Quanto pode: freio por usuário e por clínica, para um erro ou abuso não esgotar os créditos.
    const user = perUser.take(context.userId);
    if (!user.ok) return { error: waitMessage(user.retryAfterMs) };
    const clinic = perTenant.take(String(tenantId));
    if (!clinic.ok) return { error: waitMessage(clinic.retryAfterMs) };
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
