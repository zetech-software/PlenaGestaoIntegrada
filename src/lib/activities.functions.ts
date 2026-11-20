import { createServerFn } from "@tanstack/react-start";
import {
  ACTIVITY_INSTRUCTIONS,
  buildActivityPrompt,
  validateActivityRequest,
  type ActivityRequest,
} from "@/services/activity-prompt";

export type ActivitySuggestionResult = { text: string; error?: undefined } | { text?: undefined; error: string };

export const suggestActivities = createServerFn({ method: "POST" })
  .inputValidator((input: ActivityRequest) => ({
    studentFirstName: String(input.studentFirstName ?? "").slice(0, 60),
    age: Number(input.age) || 0,
    grade: String(input.grade ?? "").slice(0, 60),
    observations: String(input.observations ?? ""),
    goals: String(input.goals ?? ""),
  }))
  .handler(async ({ data }): Promise<ActivitySuggestionResult> => {
    const invalid = validateActivityRequest(data);
    if (invalid) return { error: invalid };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { error: "O serviço de IA não está configurado." };
    try {
      const { generateGatewayText } = await import("./ai/gateway.server");
      const text = await generateGatewayText(apiKey, ACTIVITY_INSTRUCTIONS, buildActivityPrompt(data));
      if (!text.trim()) return { error: "Não foi possível gerar sugestões para esta descrição." };
      return { text };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      console.error("suggestActivities failed", status, error);
      if (status === 402) return { error: "Os créditos de IA acabaram. Adicione créditos em Settings → Plans & credits." };
      if (status === 429) return { error: "Muitas solicitações no momento. Aguarde um pouco e tente de novo." };
      if (status === 403) return { error: "O acesso ao modelo de IA foi negado para esta solicitação." };
      return { error: "Não foi possível gerar as sugestões agora. Tente novamente em instantes." };
    }
  });
