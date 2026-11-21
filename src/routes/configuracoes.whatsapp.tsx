import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { MessageCircle, Plus, Trash2, Save, Unplug, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getWhatsAppAssistantSettings, saveWhatsAppAssistantSettings } from "@/lib/whatsapp-assistant.functions";
import { assistantSettingsSchema, type AssistantSettings, type AssistantService } from "@/services/whatsapp-assistant";

export const Route = createFileRoute("/configuracoes/whatsapp")({
  head: () => ({ meta: [
    { title: "Assistente de WhatsApp | Plena Gestão Integrada" },
    { name: "description", content: "Configurações de atendimento, preços e horários do assistente de WhatsApp da clínica na Plena." },
    { property: "og:title", content: "Assistente de WhatsApp | Plena Gestão Integrada" },
    { property: "og:description", content: "Serviços, preços e horários de atendimento independentes por clínica." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Suspense fallback={<p className="text-muted-foreground" role="status">Carregando configurações…</p>}><AssistantPage /></Suspense>,
  errorComponent: ({ error, reset }) => <section className="space-y-3"><p role="alert" className="text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar as configurações."}</p><Button variant="outline" onClick={reset}>Tentar novamente</Button></section>,
});

const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function AssistantPage() {
  const { session } = useAuth();
  const get = useServerFn(getWhatsAppAssistantSettings);
  const { data } = useSuspenseQuery({ queryKey: ["whatsapp-assistant", session?.user.id], queryFn: () => get() });
  return <AssistantForm key={session?.user.id} initial={data.settings} savedAt={data.savedAt} />;
}

function AssistantForm({ initial, savedAt }: { initial: AssistantSettings; savedAt: string | null }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const save = useServerFn(saveWhatsAppAssistantSettings);
  const [form, setForm] = useState(initial);
  const [feedback, setFeedback] = useState("");
  const [invalid, setInvalid] = useState("");
  const mutation = useMutation({
    mutationFn: (settings: AssistantSettings) => save({ data: settings }),
    onSuccess: (data) => {
      queryClient.setQueryData(["whatsapp-assistant", session?.user.id], data);
      setFeedback("Configurações salvas para esta clínica.");
      setInvalid("");
    },
    onError: (error) => { setInvalid(error.message); setFeedback(""); },
  });
  const change = (next: AssistantSettings) => { setForm(next); setFeedback(""); setInvalid(""); };
  const updateService = (id: string, patch: Partial<AssistantService>) => change({ ...form, services: form.services.map((s) => s.id === id ? { ...s, ...patch } : s) });
  return <form className="max-w-4xl space-y-8" onSubmit={(event) => {
    event.preventDefault();
    const parsed = assistantSettingsSchema.safeParse(form);
    if (!parsed.success) { setInvalid(parsed.error.issues[0]?.message ?? "Confira os dados informados."); return; }
    setInvalid(""); mutation.mutate(parsed.data);
  }}>
    <section className="space-y-4 border-b pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><MessageCircle className="size-6 text-primary" /><h2 className="text-xl font-semibold">Assistente de WhatsApp</h2></div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground"><Unplug className="size-4" />Não conectado</span>
      </div>
      <div className="border-l-4 border-accent bg-muted p-4">
        <p className="font-medium">Atendimento automático não ativado</p>
        <p className="mt-1 text-sm text-muted-foreground">A conexão do número desta clínica aguarda a configuração e aprovação da aplicação empresarial da Plena na Meta.</p>
      </div>
      <Button type="button" variant="outline" disabled title="Aguardando configuração da aplicação empresarial na Meta"><MessageCircle />Conectar WhatsApp da clínica</Button>
    </section>

    <section className="space-y-4 border-b pb-6">
      <h3 className="text-lg font-semibold">Serviços e preços</h3>
      {form.services.length === 0 && <p className="text-sm text-muted-foreground">Nenhum atendimento cadastrado.</p>}
      {form.services.map((service, index) => <div key={service.id} className="grid gap-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <label className="space-y-1 text-sm font-medium">Atendimento {index + 1}<Input required maxLength={160} value={service.name} onChange={(e) => updateService(service.id, { name: e.target.value })} /></label>
        <label className="space-y-1 text-sm font-medium">Valor (R$)<Input type="number" required min={0} max={1000000} step="0.01" value={service.priceCents / 100} onChange={(e) => updateService(service.id, { priceCents: Math.round(Number(e.target.value) * 100) })} /></label>
        <label className="space-y-1 text-sm font-medium">Duração (min)<Input type="number" required min={15} max={240} step={1} value={service.durationMinutes} onChange={(e) => updateService(service.id, { durationMinutes: Number(e.target.value) })} /></label>
        <div className="flex items-end justify-between gap-4 pb-1"><label className="flex h-9 items-center gap-2 text-sm"><Switch checked={service.active} onCheckedChange={(active) => updateService(service.id, { active })} aria-label={`Oferecer ${service.name || `atendimento ${index + 1}`}`} />Ativo</label><Button type="button" variant="ghost" size="icon" title="Remover atendimento" aria-label={`Remover atendimento ${index + 1}`} onClick={() => change({ ...form, services: form.services.filter((s) => s.id !== service.id) })}><Trash2 /></Button></div>
      </div>)}
      <Button type="button" variant="outline" disabled={form.services.length >= 50} onClick={() => change({ ...form, services: [...form.services, { id: crypto.randomUUID(), name: "", priceCents: 0, durationMinutes: 45, active: true }] })}><Plus />Adicionar atendimento</Button>
    </section>

    <section className="space-y-4 border-b pb-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Clock3 className="size-5 text-primary" />Horários para agendamento</h3>
      <label className="block max-w-sm space-y-1 text-sm font-medium">Fuso horário<select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.timezone} onChange={(e) => change({ ...form, timezone: assistantSettingsSchema.shape.timezone.parse(e.target.value) })}>
        <option value="America/Sao_Paulo">Brasília (UTC−3)</option><option value="America/Manaus">Manaus (UTC−4)</option><option value="America/Rio_Branco">Rio Branco (UTC−5)</option><option value="America/Noronha">Fernando de Noronha (UTC−2)</option>
      </select></label>
      <div className="space-y-3">{form.hours.map((row) => <div key={row.day} className="grid items-center gap-3 border-b pb-3 sm:grid-cols-[180px_1fr]">
        <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={row.enabled} aria-label={`Agendar ${days[row.day]}`} onCheckedChange={(enabled) => change({ ...form, hours: form.hours.map((h) => h.day === row.day ? { ...h, enabled } : h) })} />{days[row.day]}</label>
        <div className="flex min-w-0 items-center gap-2"><Input className="min-w-0 flex-1" type="time" aria-label={`Início ${days[row.day]}`} disabled={!row.enabled} value={row.start} onChange={(e) => change({ ...form, hours: form.hours.map((h) => h.day === row.day ? { ...h, start: e.target.value } : h) })} /><span className="text-sm text-muted-foreground">até</span><Input className="min-w-0 flex-1" type="time" aria-label={`Fim ${days[row.day]}`} disabled={!row.enabled} value={row.end} onChange={(e) => change({ ...form, hours: form.hours.map((h) => h.day === row.day ? { ...h, end: e.target.value } : h) })} /></div>
      </div>)}</div>
    </section>

    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Mensagens e transferência</h3>
      <label className="block space-y-1 text-sm font-medium">Mensagem de boas-vindas<Textarea minLength={10} maxLength={1000} required rows={3} value={form.greeting} onChange={(e) => change({ ...form, greeting: e.target.value })} /></label>
      <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Destino quando precisar de ajuda humana</legend>{([{ value: "panel", label: "Painel da clínica" }, { value: "business_app", label: "Aplicativo WhatsApp Business" }] as const).map((option) => <label key={option.value} className="flex items-center gap-2 text-sm"><input type="radio" name="handoff" value={option.value} checked={form.handoffDestination === option.value} onChange={() => change({ ...form, handoffDestination: option.value })} />{option.label}</label>)}</fieldset>
      <label className="block space-y-1 text-sm font-medium">Mensagem ao encaminhar a conversa<Textarea minLength={10} maxLength={1000} required rows={3} value={form.handoffMessage} onChange={(e) => change({ ...form, handoffMessage: e.target.value })} /></label>
    </section>
    <footer className="flex flex-wrap items-center gap-4 border-t pt-5">
      <Button type="submit" disabled={mutation.isPending}><Save />{mutation.isPending ? "Salvando…" : "Salvar configurações"}</Button>
      {feedback && <p role="status" className="text-sm text-primary">{feedback}</p>}
      {invalid && <p role="alert" className="text-sm text-destructive">{invalid}</p>}
      {savedAt && !feedback && <p className="text-sm text-muted-foreground">Configurações cadastradas</p>}
    </footer>
  </form>;
}