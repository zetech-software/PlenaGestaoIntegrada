import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TenantDraft, TenantKind } from "@/types/tenant";

export interface ProvisionResult {
  error?: string;
  id?: string;
}

function digits(v: unknown) {
  return String(v ?? "").replace(/\D/g, "");
}

export const provisionTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TenantDraft) => {
    const kind: TenantKind = input.kind === "autonomo" ? "autonomo" : "clinica";
    const document = digits(input.document);
    const ownerEmail = String(input.ownerEmail ?? "").trim().toLowerCase();
    const name = String(input.name ?? "").trim().slice(0, 160);
    const ownerName = String(input.ownerName ?? "").trim().slice(0, 120);
    const seats = kind === "autonomo" ? 1 : Math.trunc(Number(input.seats));
    if (!name) throw new Error("Informe o nome.");
    if (kind === "clinica" ? document.length !== 14 : document.length !== 11)
      throw new Error("Documento inválido.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) throw new Error("E-mail inválido.");
    if (!(seats >= 1 && seats <= 200)) throw new Error("Vagas devem ficar entre 1 e 200.");
    return {
      kind,
      name,
      document,
      ownerName,
      ownerEmail,
      phone: String(input.phone ?? "").slice(0, 40),
      registration: String(input.registration ?? "").slice(0, 60),
      seats,
    };
  })
  .handler(async ({ data, context }): Promise<ProvisionResult> => {
    const { data: isOperator } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "plataforma",
    });
    if (!isOperator) return { error: "Apenas o operador da plataforma cadastra clientes." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from("tenants")
      .insert({
        kind: data.kind,
        name: data.name,
        document: data.document,
        owner_name: data.ownerName,
        owner_email: data.ownerEmail,
        phone: data.phone,
        registration: data.registration,
        seats: data.seats,
      })
      .select("id")
      .single();
    if (tErr || !tenant) {
      if (tErr?.code === "23505") return { error: "Já existe cliente com este documento ou e-mail." };
      return { error: "Não foi possível cadastrar o cliente." };
    }

    let userId: string | null = null;
    const undo = async (message: string): Promise<ProvisionResult> => {
      if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      return { error: message };
    };

    const { data: invited, error: iErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.ownerEmail,
      { data: { full_name: data.ownerName } },
    );
    if (iErr || !invited.user) {
      console.error("provisionTenant invite failed", iErr);
      return undo(
        /already/i.test(iErr?.message ?? "")
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível enviar o convite. Nada foi cadastrado.",
      );
    }
    userId = invited.user.id;

    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.ownerEmail, full_name: data.ownerName, tenant_id: tenant.id });
    if (pErr) return undo("Não foi possível criar o perfil do responsável.");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const roles = data.kind === "autonomo" ? (["admin", "terapeuta"] as const) : (["admin"] as const);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert(roles.map((role) => ({ user_id: userId as string, role })));
    if (rErr) return undo("Não foi possível atribuir o perfil do responsável.");
    return { id: tenant.id };
  });
