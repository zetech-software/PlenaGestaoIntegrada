export interface ActivityRequest {
  studentFirstName: string;
  age: number;
  grade: string;
  observations: string;
  goals: string;
}

export const ACTIVITY_LIMITS = { min: 10, max: 2000 } as const;

/** Returns an error message in Portuguese, or null when the request is valid. */
export function validateActivityRequest(input: ActivityRequest): string | null {
  const observations = input.observations.trim();
  const goals = input.goals.trim();
  if (observations.length < ACTIVITY_LIMITS.min)
    return "Descreva as observações com pelo menos 10 caracteres.";
  if (goals.length < ACTIVITY_LIMITS.min)
    return "Descreva os objetivos com pelo menos 10 caracteres.";
  if (observations.length > ACTIVITY_LIMITS.max || goals.length > ACTIVITY_LIMITS.max)
    return "Cada campo pode ter no máximo 2000 caracteres.";
  return null;
}

export const ACTIVITY_INSTRUCTIONS = `Você apoia profissionais que acompanham o desenvolvimento, a aprendizagem e o cuidado de pacientes e alunos (Plena Gestão Integrada).
Sugira de 4 a 6 atividades de acompanhamento personalizadas, práticas e lúdicas quando adequado, em português do Brasil.
Para cada atividade use exatamente este formato:
### Nome da atividade
**Objetivo relacionado:** ...
**Como aplicar:** passos curtos.
**Materiais:** ...
**Sinais de progresso para observar:** ...
Regras obrigatórias: nunca faça diagnósticos, hipóteses diagnósticas ou rótulos clínicos; não recomende medicação; as sugestões são apoio e a decisão é sempre do profissional. Termine com uma linha curta lembrando isso.`;

export function buildActivityPrompt(input: ActivityRequest) {
  return `Pessoa acompanhada: ${input.studentFirstName}, ${input.age} anos, ${input.grade || "série não informada"}.
Observações do profissional:
${input.observations.trim()}

Objetivos de acompanhamento:
${input.goals.trim()}`;
}
