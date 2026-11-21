import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, UserPlus, Search, RefreshCw, Check, Minus } from "lucide-react";
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
import {
  canAccess,
  primaryRole,
  roleLabels,
  type ClinicRole,
  type Area,
} from "@/services/permissions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
const permissionAreas: { label: string; area: Area }[] = [
  { label: "Painel e agenda", area: "agenda" },
  { label: "Alunos e prontuários", area: "prontuarios" },
  { label: "Intervenções e relatórios", area: "relatorios" },
  { label: "Financeiro", area: "financeiro" },
  { label: "Configurações da clínica", area: "configuracoes" },
  { label: "Administrar usuários e permissões", area: "usuarios" },
  { label: "Auditoria", area: "auditoria" },
];

function UsersPage() {
  const { session, reloadAccess } = useAuth();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pendingRole, setPendingRole] = useState<{ row: Row; role: ClinicRole } | null>(null);
  const [saving, setSaving] = useState(false);
  const filteredRows = rows.filter(
    (row) =>
      (roleFilter === "all" || row.role === roleFilter) &&
      `${row.fullName} ${row.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const tenant = await supabase.rpc("current_tenant_id");
      if (tenant.error || !tenant.data) throw new Error("Clínica indisponível");
      const [p, r, a, s] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name")
          .eq("tenant_id", tenant.data)
          .order("full_name"),
        supabase.from("user_roles").select("user_id,role"),
        supabase
          .from("student_assignments")
          .select("user_id,student_id")
          .eq("tenant_id", tenant.data),
        supabase.from("students").select("id,name").eq("tenant_id", tenant.data).order("name"),
      ]);
      if (p.error || r.error || a.error || s.error) throw new Error("Consulta indisponível");
      setStudents(s.data ?? []);
      const list: Row[] = [];
      for (const x of p.data ?? []) {
        const role = primaryRole(
          (r.data ?? []).filter((y) => y.user_id === x.id).map((y) => y.role),
        );
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
    } catch {
      setLoadError("Não foi possível consultar a equipe. Tente atualizar a lista.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(row: Row, role: ClinicRole) {
    if (row.id === session?.user.id && role !== "admin") {
      setMessage("Você não pode remover o seu próprio acesso de administrador.");
      return;
    }
    setSaving(true);
    try {
      // Troca a linha existente sem apagar o acesso antes de gravar o novo perfil.
      const result = row.role
        ? await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", row.id)
            .eq("role", row.role)
            .select("id")
        : await supabase.from("user_roles").insert({ user_id: row.id, role }).select("id");
      if (result.error || !result.data?.length) {
        setMessage("Não foi possível alterar o perfil. O último administrador deve ser mantido.");
        return;
      }
      setMessage(`Perfil de ${row.fullName || "usuário"} alterado para ${roleLabels[role]}.`);
      setPendingRole(null);
      await load();
      if (row.id === session?.user.id) await reloadAccess();
    } catch {
      setMessage("Não foi possível alterar o perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }
  async function toggleStudent(row: Row, studentId: string, on: boolean) {
    setSaving(true);
    try {
      const res = on
        ? await supabase
            .from("student_assignments")
            .insert({ user_id: row.id, student_id: studentId, student_ref: studentId })
        : await supabase
            .from("student_assignments")
            .delete()
            .eq("user_id", row.id)
            .eq("student_id", studentId);
      setMessage(
        res.error ? "Não foi possível atualizar os alunos." : "Vínculos de alunos atualizados.",
      );
      await load();
    } catch {
      setMessage("Não foi possível atualizar os alunos. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={15} /> USUÁRIOS E PERFIS
          </div>
          <h1>Usuários e permissões</h1>
          <p>Equipe da clínica</p>
        </div>
        <div className="heading-actions">
          <Button
            variant="outline"
            size="icon"
            aria-label="Atualizar equipe"
            title="Atualizar equipe"
            disabled={loading || saving}
            onClick={() => void load()}
          >
            <RefreshCw />
          </Button>
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
                type="password"
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

      <Tabs defaultValue="team" className="mt-6 min-w-0 w-full">
        <TabsList className="max-w-full">
          <TabsTrigger value="team">Equipe ({rows.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissões por perfil</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-5">
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <div className="relative min-w-0 flex-1 basis-48">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input
                className="pl-9 bg-card"
                aria-label="Buscar usuário"
                placeholder="Buscar por nome ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-card" aria-label="Filtrar por perfil">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                {allRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loadError ? (
            <p role="alert" className="mb-4 text-destructive">
              {loadError}
            </p>
          ) : null}
          {loading ? (
            <p role="status" className="py-6">
              Carregando equipe...
            </p>
          ) : !filteredRows.length ? (
            <p className="py-6 text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : null}
          <div className="schedule" aria-busy={loading || saving}>
            {filteredRows.map((row) => (
              <div key={row.id} className="user-row">
                <div className="flex flex-wrap items-center gap-3 py-4">
                  <span className="avatar">
                    {(row.fullName || row.email).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <strong className="block text-sm break-words">
                      {row.fullName || "Usuário sem nome"}
                    </strong>
                    <small className="block text-muted-foreground break-all">
                      {row.email}
                      {row.id === session?.user.id ? " · você" : ""}
                    </small>
                  </div>
                  <Select
                    value={row.role ?? ""}
                    disabled={saving || row.id === session?.user.id}
                    onValueChange={(v) => {
                      if (allRoles.includes(v as ClinicRole) && v !== row.role)
                        setPendingRole({ row, role: v as ClinicRole });
                    }}
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
                    {!students.length ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum aluno disponível para vínculo.
                      </p>
                    ) : null}
                    {students.map((s) => (
                      <label key={s.id} className="assign-item">
                        <Checkbox
                          checked={row.students.includes(s.id)}
                          disabled={saving}
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
        </TabsContent>
        <TabsContent value="permissions" className="mt-5 min-w-0 w-full">
          <div className="max-w-full overflow-x-auto border border-border rounded-lg bg-card">
            <table className="w-full text-sm min-w-96">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left">Área</th>
                  {allRoles.map((role) => (
                    <th key={role} className="p-4 text-center">
                      {roleLabels[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionAreas.map(({ label, area }) => (
                  <tr key={area} className="border-b border-border">
                    <th className="p-4 text-left font-medium">{label}</th>
                    {allRoles.map((role) => (
                      <td key={role} className="p-4 text-center">
                        {canAccess(role, area) ? (
                          <Check
                            className="mx-auto text-primary"
                            size={18}
                            aria-label="Permitido"
                          />
                        ) : (
                          <Minus
                            className="mx-auto text-muted-foreground"
                            size={18}
                            aria-label="Sem acesso"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th className="p-4 text-left font-medium">Alunos visíveis</th>
                  <td className="p-4 text-center">Todos da clínica</td>
                  <td className="p-4 text-center">Todos da clínica</td>
                  <td className="p-4 text-center">Somente vinculados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog
        open={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setPendingRole(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar permissão de acesso</DialogTitle>
            <DialogDescription>
              {pendingRole
                ? `${pendingRole.row.fullName || "Usuário"}: ${pendingRole.row.role ? roleLabels[pendingRole.row.role] : "Sem perfil"} → ${roleLabels[pendingRole.role]}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setPendingRole(null)}>
              Cancelar
            </Button>
            <Button
              disabled={saving}
              onClick={() => {
                if (pendingRole) void changeRole(pendingRole.row, pendingRole.role);
              }}
            >
              {saving ? "Salvando..." : "Confirmar alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DemoFooter />
    </main>
  );
}
