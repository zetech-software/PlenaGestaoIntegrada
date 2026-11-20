export type AppRole = "admin" | "terapeuta" | "clinica" | "plataforma";
/** Papéis que o administrador de uma clínica pode atribuir. O operador da plataforma nunca é atribuído por aqui. */
export type ClinicRole = Exclude<AppRole, "plataforma">;
export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  terapeuta: "Terapeuta",
  clinica: "Clínica",
  plataforma: "Operador da plataforma",
};
export type Area =
  | "dashboard"
  | "alunos"
  | "agenda"
  | "prontuarios"
  | "intervencoes"
  | "relatorios"
  | "usuarios"
  | "auditoria"
  | "financeiro"
  | "configuracoes"
  | "plataforma";

/** Maior privilégio vence quando a conta tem mais de um perfil. */
export function primaryRole(roles: AppRole[]): AppRole | null {
  // Separação de funções: conta de operador da plataforma não enxerga dados clínicos de nenhum cliente,
  // mesmo que por engano receba outro perfil.
  if (roles.includes("plataforma")) return "plataforma";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("clinica")) return "clinica";
  if (roles.includes("terapeuta")) return "terapeuta";
  return null;
}
export function canAccess(role: AppRole | null, area: Area) {
  if (!role) return false;
  // O operador só abre o painel da plataforma; as áreas dos clientes ficam fechadas para ele.
  if (role === "plataforma") return area === "plataforma";
  if (area === "plataforma") return false;
  if (area === "usuarios" || area === "auditoria") return role === "admin";
  if (area === "configuracoes" || area === "financeiro")
    return role === "admin" || role === "clinica";
  return true;
}
/** Terapeuta só vê alunos vinculados; admin e clínica veem todos. */
export function canSeeStudent(role: AppRole | null, assigned: string[], studentId: string) {
  if (role === "admin" || role === "clinica") return true;
  if (role === "terapeuta") return assigned.includes(studentId);
  return false;
}
/** Registrar ou revogar consentimento é um ato administrativo. */
export function canManageConsent(role: AppRole | null) {
  return role === "admin" || role === "clinica";
}
/** Exportar todos os dados de um aluno é restrito a admin e clínica. */
export function canExportStudent(role: AppRole | null) {
  return role === "admin" || role === "clinica";
}
export function areaForPath(pathname: string): Area {
  if (pathname.startsWith("/plataforma")) return "plataforma";
  if (pathname.startsWith("/auditoria")) return "auditoria";
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/usuarios")) return "usuarios";
  if (pathname.startsWith("/configuracoes")) return "configuracoes";
  if (pathname.startsWith("/prontuarios") || /\/(anamnese|prontuario)$/.test(pathname))
    return "prontuarios";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/intervencoes")) return "intervencoes";
  if (pathname.startsWith("/relatorios")) return "relatorios";
  if (pathname.startsWith("/alunos")) return "alunos";
  return "dashboard";
}
