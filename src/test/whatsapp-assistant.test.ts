import { describe, expect, it } from "vitest";
import { assistantSettingsSchema, defaultAssistantSettings, quoteService } from "@/services/whatsapp-assistant";

const id = "a05863e0-825a-4c60-aa0a-5a6ee5aa0620";
describe("configuração do assistente por clínica", () => {
  it("orça exatamente o preço configurado pela clínica, sem preço dos planos Plena", () => {
    const settings = defaultAssistantSettings();
    settings.services = [{ id, name: "Consulta", priceCents: 18350, durationMinutes: 45, active: true }];
    expect(quoteService(settings, id)).toEqual({ priceCents: 18350, durationMinutes: 45 });
  });
  it("não inventa preços quando o serviço não foi cadastrado", () => {
    expect(quoteService(defaultAssistantSettings(), id)).toBeNull();
  });
  it("não oferece atendimento desativado", () => {
    const settings = defaultAssistantSettings();
    settings.services = [{ id, name: "Consulta", priceCents: 18350, durationMinutes: 45, active: false }];
    expect(quoteService(settings, id)).toBeNull();
  });
  it("exige horários válidos para agendar", () => {
    const settings = defaultAssistantSettings();
    settings.hours[0] = { day: 0, enabled: true, start: "18:00", end: "08:00" };
    expect(assistantSettingsSchema.safeParse(settings).success).toBe(false);
  });
  it("não autoriza horários até a clínica configurá-los", () => {
    expect(defaultAssistantSettings().hours.every((row) => !row.enabled)).toBe(true);
  });
});