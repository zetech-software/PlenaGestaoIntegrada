export type AppRole = "admin" | "terapeuta" | "clinica";
export const roleLabels: Record<AppRole, string> = { admin: "Administrador", terapeuta: "Terapeuta", clinica: "Clínica" };
export type Area = "dashboard" | "alunos" | "agenda" | "prontuarios" | "usuarios";

/** Maior privilégio vence quando a conta tem mais de um perfil. */
export function primaryRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("clinica")) return "clinica";
  if (roles.includes("terapeuta")) return "terapeuta";
  return null;
}
export function canAccess(role: AppRole | null, area: Area) {
  if (!role) return false;
  if (area === "usuarios") return role === "admin";
  return true;
}
/** Terapeuta só vê alunos vinculados; admin e clínica veem todos. */
export function canSeeStudent(role: AppRole | null, assigned: string[], studentId: string) {
  if (role === "admin" || role === "clinica") return true;
  if (role === "terapeuta") return assigned.includes(studentId);
  return false;
}
export function areaForPath(pathname: string): Area {
  if (pathname.startsWith("/usuarios")) return "usuarios";
  if (pathname.startsWith("/prontuarios") || /\/(anamnese|prontuario)$/.test(pathname)) return "prontuarios";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/alunos")) return "alunos";
  return "dashboard";
}
