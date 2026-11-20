import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/services/permissions";

const roles: AppRole[] = ["admin", "terapeuta", "clinica"];
interface NewUser {
  email: string;
  fullName: string;
  password: string;
  role: AppRole;
}

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NewUser) => {
    const email = String(input.email ?? "")
      .trim()
      .toLowerCase();
    const fullName = String(input.fullName ?? "")
      .trim()
      .slice(0, 120);
    const password = String(input.password ?? "");
    const role = roles.includes(input.role) ? input.role : "terapeuta";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
    if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
    return { email, fullName, password, role };
  })
  .handler(async ({ data, context }): Promise<{ error?: string }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { error: "Apenas administradores podem criar usuários." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "";
      if (/already/i.test(msg)) return { error: "Já existe uma conta com este e-mail." };
      if (/weak|pwned/i.test(msg))
        return { error: "Senha muito fácil de adivinhar. Escolha outra." };
      return { error: "Não foi possível criar o usuário." };
    }
    if (data.role !== "terapeuta") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    }
    return {};
  });
