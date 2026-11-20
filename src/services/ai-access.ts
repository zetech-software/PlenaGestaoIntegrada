/** Regras de acesso e de uso da IA. Puras, para testar sem rede nem banco. */

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);

export interface AiAccessInput {
  /** Clínica do usuário logado; nulo para quem não pertence a nenhuma (ex.: operador da plataforma). */
  tenantId: string | null;
  tenantActive: boolean;
  studentId: string;
  /** Resultado da checagem de consentimento de IA no banco (só vale para aluno do banco). */
  consentOk: boolean;
  /** Chave de transição para a demonstração: alunos em memória não têm consentimento verificável. */
  allowDemoStudents: boolean;
}
export type AiAccessDecision = { ok: true } | { ok: false; error: string };

export function decideAiAccess(input: AiAccessInput): AiAccessDecision {
  if (!input.tenantId || !input.tenantActive)
    return { ok: false, error: "Sem acesso a este recurso." };
  if (!input.studentId) return { ok: false, error: "Aluno não informado." };
  if (isUuid(input.studentId)) {
    return input.consentOk
      ? { ok: true }
      : {
          ok: false,
          error: "Sem consentimento vigente do responsável para uso de IA com este aluno.",
        };
  }
  // Id que não é UUID = aluno da demonstração em memória. O servidor não consegue conferir o
  // consentimento dele, então por padrão a IA recusa.
  return input.allowDemoStudents
    ? { ok: true }
    : {
        ok: false,
        error:
          "Este aluno ainda não está no banco de dados. A IA só atende alunos cadastrados, com consentimento do responsável.",
      };
}

export type RateDecision = { ok: true } | { ok: false; retryAfterMs: number };
/**
 * Janela deslizante em memória. É um freio de melhor esforço: cada instância do servidor tem a sua
 * contagem. Um limite que vale para todas as instâncias precisa de armazenamento compartilhado (banco).
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    take(key: string): RateDecision {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: windowMs - (t - (recent[0] ?? t)) };
      }
      recent.push(t);
      hits.set(key, recent);
      // Evita crescer sem limite: descarta chaves que já saíram da janela.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.every((at) => t - at >= windowMs)) hits.delete(k);
      }
      return { ok: true };
    },
  };
}
export const waitMessage = (retryAfterMs: number) =>
  `Muitas solicitações. Tente de novo em ${Math.max(1, Math.ceil(retryAfterMs / 60_000))} min.`;
