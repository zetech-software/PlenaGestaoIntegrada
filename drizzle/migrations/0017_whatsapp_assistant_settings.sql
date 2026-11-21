CREATE TABLE public.whatsapp_assistant_settings (
  tenant_id uuid PRIMARY KEY DEFAULT public.current_tenant_id() REFERENCES public.tenants(id) ON DELETE RESTRICT,
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object' AND octet_length(config::text) <= 64000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_assistant_settings TO authenticated;
GRANT ALL ON public.whatsapp_assistant_settings TO service_role;
ALTER TABLE public.whatsapp_assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_settings_staff ON public.whatsapp_assistant_settings FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY whatsapp_settings_tenant ON public.whatsapp_assistant_settings AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.current_tenant_id() AND public.tenant_is_active()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.tenant_is_active());
