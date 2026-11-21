import { createStableContext } from "@/lib/stable-context";
import { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { primaryRole, type AppRole } from "@/services/permissions";
interface Ctx {
  session: Session | null;
  ready: boolean;
  role: AppRole | null;
  assigned: string[];
  reloadAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createStableContext<Ctx>("AuthContext");
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [assigned, setAssigned] = useState<string[]>([]);
  const userId = session?.user.id;
  const reloadAccess = useCallback(async () => {
    if (!userId) {
      setRole(null);
      setAssigned([]);
      return;
    }
    const [roles, links] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("student_assignments").select("student_id").eq("user_id", userId),
    ]);
    setRole(primaryRole((roles.data ?? []).map((r) => r.role)));
    setAssigned((links.data ?? []).map((l) => l.student_id));
  }, [userId]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED") return;
      setSession(s);
      if (!s) setReady(true);
    });
    void supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      if (!d.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!userId) return;
    setReady(false);
    void reloadAccess().then(() => setReady(true));
  }, [userId, reloadAccess]);
  return (
    <AuthContext.Provider
      value={{
        session,
        ready,
        role,
        assigned,
        reloadAccess,
        signOut: async () => {
          await queryClient.cancelQueries();
          const { error } = await supabase.auth.signOut({ scope: "local" });
          if (error) throw error;
          queryClient.clear();
          setSession(null);
          setRole(null);
          setAssigned([]);
          await navigate({ to: "/", replace: true });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider is required");
  return ctx;
}
