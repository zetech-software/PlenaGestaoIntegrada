import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do atendimento.").max(160),
  priceCents: z.number().int().min(0).max(100000000),
  durationMinutes: z.number().int().min(15).max(240),
  active: z.boolean(),
});
export const hoursSchema = z.object({
  day: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine((row) => !row.enabled || row.start < row.end, {
  message: "O horário final deve ser posterior ao inicial.", path: ["end"],
});
export const assistantSettingsSchema = z.object({
  greeting: z.string().trim().min(10).max(1000),
  handoffMessage: z.string().trim().min(10).max(1000),
  handoffDestination: z.enum(["panel", "business_app"]),
  timezone: z.enum(["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "America/Noronha"]),
  services: z.array(serviceSchema).max(50).refine((items) => new Set(items.map((s) => s.id)).size === items.length, "Atendimentos duplicados."),
  hours: z.array(hoursSchema).length(7).refine((items) => new Set(items.map((h) => h.day)).size === 7, "Informe cada dia uma vez."),
});
export type AssistantSettings = z.infer<typeof assistantSettingsSchema>;
export type AssistantService = z.infer<typeof serviceSchema>;

// Defaults do not authorize appointments or invent a clinic's prices.
export function defaultAssistantSettings(): AssistantSettings {
  return {
    greeting: "Olá! Sou o assistente virtual da clínica. Como posso ajudar?",
    handoffMessage: "Vou encaminhar sua conversa à equipe da clínica. O retorno será feito assim que um responsável estiver disponível.",
    handoffDestination: "panel",
    timezone: "America/Sao_Paulo",
    services: [],
    hours: Array.from({ length: 7 }, (_, day) => ({ day, enabled: false, start: "08:00", end: "18:00" })),
  };
}

export function quoteService(settings: AssistantSettings, serviceId: string): { priceCents: number; durationMinutes: number } | null {
  const service = settings.services.find((item) => item.id === serviceId && item.active);
  return service ? { priceCents: service.priceCents, durationMinutes: service.durationMinutes } : null;
}