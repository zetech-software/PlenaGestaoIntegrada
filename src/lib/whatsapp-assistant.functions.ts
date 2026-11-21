import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assistantSettingsSchema, defaultAssistantSettings } from "@/services/whatsapp-assistant";

export const getWhatsAppAssistantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error: accessError } = await context.supabase.rpc("is_staff");
    if (accessError || !allowed) throw new Error("Apenas a administração de uma clínica ativa pode configurar o assistente.");
    const { data, error } = await context.supabase.from("whatsapp_assistant_settings").select("config, updated_at").maybeSingle();
    if (error) throw new Error("Não foi possível consultar as configurações do assistente.");
    return {
      settings: data ? assistantSettingsSchema.parse(data.config) : defaultAssistantSettings(),
      savedAt: data?.updated_at ?? null,
      connected: false as const,
    };
  });

export const saveWhatsAppAssistantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => assistantSettingsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const [access, tenant] = await Promise.all([
      context.supabase.rpc("is_staff"),
      context.supabase.rpc("current_tenant_id"),
    ]);
    if (access.error || tenant.error || !access.data || !tenant.data)
      throw new Error("Apenas a administração de uma clínica ativa pode configurar o assistente.");
    const { data: saved, error } = await context.supabase.from("whatsapp_assistant_settings")
      .upsert({ tenant_id: tenant.data, config: data, updated_at: new Date().toISOString() })
      .select("updated_at").single();
    if (error || !saved) throw new Error("Não foi possível salvar as configurações do assistente.");
    return { settings: data, savedAt: saved.updated_at, connected: false as const };
  });