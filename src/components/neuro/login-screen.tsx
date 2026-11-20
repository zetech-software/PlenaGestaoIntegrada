import { useState } from "react";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="brand">
          <span className="brand-symbol"><Sprout size={24} strokeWidth={1.7} /></span>
          <span className="brand-copy">
            <span className="brand-name">Plena<span className="text-sand">.</span></span>
            <span className="brand-caption block">Gestão Integrada · Ze Tech</span>
          </span>
        </div>
        <h1>Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse seu espaço de acompanhamento.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            setBusy(false);
            if (err) setError("E-mail ou senha incorretos.");
          }}
        >
          <div className="form-field"><label htmlFor="lg-email">E-mail</label><Input id="lg-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="form-field"><label htmlFor="lg-pass">Senha</label><Input id="lg-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error ? <p className="ai-error" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
        </form>
      </div>
    </main>
  );
}
