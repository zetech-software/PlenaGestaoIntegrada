import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { demoStudents } from "@/data/demo-students";
import { primaryRole, roleLabels, type ClinicRole } from "@/services/permissions";
import { createAppUser } from "@/lib/users.functions";
import { DemoFooter } from "@/components/neuro/student-ui";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | Plena Gestão Integrada" },
      {
        name: "description",
        content: "Gestão de usuários, perfis de acesso e vínculo de alunos aos terapeutas.",
      },
      { property: "og:title", content: "Usuários | Plena Gestão Integrada" },
      {
        property: "og:description",
        content: "Defina quem acessa o quê na Plena Gestão Integrada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

interface Row {
  id: string;
  email: string;
  fullName: string;
  role: ClinicRole | null;
  students: string[];
}
const allRoles: ClinicRole[] = ["admin", "clinica", "terapeuta"];

function UsersPage() {
  const { session, reloadAccess } = useAuth();
  const create = useServerFn(createAppUser);
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "terapeuta" as ClinicRole,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, r, a] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("student_assignments").select("user_id,student_id"),
    ]);
    const list: Row[] = [];
    for (const x of p.data ?? []) {
      const role = primaryRole((r.data ?? []).filter((y) => y.user_id === x.id).map((y) => y.role));
      // Contas de operador da plataforma não fazem parte de nenhuma clínica: não aparecem aqui.
      if (role === "plataforma") continue;
      list.push({
        id: x.id,
        email: x.email,
        fullName: x.full_name,
        role,
        students: (a.data ?? []).filter((y) => y.user_id === x.id).map((y) => y.student_id),
      });
    }
    setRows(list);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(row: Row, role: ClinicRole) {
    if (row.id === session?.user.id && role !== "admin") {
      setMessage("Você não pode remover o seu próprio acesso de administrador.");
      return;
    }
    await supabase.from("user_roles").delete().eq("user_id", row.id);
    const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role });
    setMessage(
      error
        ? "Não foi possível alterar o perfil."
        : `Perfil de ${row.email} alterado para ${roleLabels[role]}.`,
    );
    await load();
    if (row.id === session?.user.id) await reloadAccess();
  }
  async function toggleStudent(row: Row, studentId: string, on: boolean) {
    const res = on
      ? await supabase
          .from("student_assignments")
          .insert({ user_id: row.id, student_id: studentId })
      : await supabase
          .from("student_assignments")
          .delete()
          .eq("user_id", row.id)
          .eq("student_id", studentId);
    if (res.error) setMessage("Não foi possível atualizar os alunos.");
    await load();
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={15} /> USUÁRIOS E PERFIS
          </div>
          <h1>Usuários</h1>
          <p>Defina quem acessa o sistema e quais alunos cada terapeuta acompanha.</p>
        </div>
        <div className="heading-actions">
          <Button onClick={() => setShowNew((v) => !v)}>
            <UserPlus /> Novo usuário
          </Button>
        </div>
      </div>

      <div className="role-legend">
        <div>
          <strong>Administrador</strong>
          <span>Vê tudo e gerencia usuários.</span>
        </div>
        <div>
          <strong>Clínica</strong>
          <span>Vê todos os alunos, agenda e prontuários.</span>
        </div>
        <div>
          <strong>Terapeuta</strong>
          <span>Vê só os alunos vinculados a ele.</span>
        </div>
      </div>

      {showNew ? (
        <form
          className="form-section agenda-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const res = await create({ data: form });
              if (res.error) setMessage(res.error);
              else {
                setMessage(`Usuário ${form.email} criado.`);
                setForm({ fullName: "", email: "", password: "", role: "terapeuta" });
                setShowNew(false);
                await load();
              }
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Não foi possível criar o usuário.");
            }
            setBusy(false);
          }}
        >
          <h2>Novo usuário</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="nu-name">Nome</label>
              <Input
                id="nu-name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="nu-email">E-mail</label>
              <Input
                id="nu-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="nu-pass">Senha inicial</label>
              <Input
                id="nu-pass"
                type="text"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Perfil</label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as ClinicRole })}
              >
                <SelectTrigger className="bg-card" aria-label="Perfil do novo usuário">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </form>
      ) : null}

      {message ? (
        <div className="demo-note" role="status">
          {message}
        </div>
      ) : null}

      <div className="schedule">
        {rows.map((row) => (
          <div key={row.id} className="user-row">
            <div className="appointment">
              <span className="avatar">
                {(row.fullName || row.email).slice(0, 2).toUpperCase()}
              </span>
              <div className="appointment-info">
                <strong>{row.fullName || row.email}</strong>
                <small>
                  {row.email}
                  {row.id === session?.user.id ? " · você" : ""}
                </small>
              </div>
              <Select
                value={row.role ?? ""}
                onValueChange={(v) => void changeRole(row, v as ClinicRole)}
              >
                <SelectTrigger className="w-40 bg-card" aria-label={`Perfil de ${row.email}`}>
                  <SelectValue placeholder="Sem perfil" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {row.role === "terapeuta" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(editing === row.id ? null : row.id)}
                >
                  Alunos ({row.students.length})
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground w-24 text-right">
                  Todos os alunos
                </span>
              )}
            </div>
            {editing === row.id && row.role === "terapeuta" ? (
              <div className="assign-grid">
                {demoStudents.map((s) => (
                  <label key={s.id} className="assign-item">
                    <Checkbox
                      checked={row.students.includes(s.id)}
                      onCheckedChange={(v) => void toggleStudent(row, s.id, v === true)}
                      aria-label={`Vincular ${s.name}`}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <DemoFooter />
    </main>
  );
}
