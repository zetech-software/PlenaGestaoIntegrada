# Fase 2 — confiança e conformidade

## Estado

- **Feito no código (demonstração, em memória):**
  - **Consentimento do responsável**, por finalidade (tratamento de dados, compartilhamento com a escola,
    uso de IA), no perfil do aluno. Revogar mantém o histórico. Sem consentimento de IA, as sugestões ficam
    bloqueadas; sem consentimento de tratamento, o perfil mostra um aviso.
  - **Auditoria de acesso** (`/auditoria`, só administradores): quem abriu o perfil, a anamnese, o prontuário ou
    um plano, e quem criou, editou, exportou ou mexeu em consentimento. O registro só aceita inclusão.
  - **Exportação dos dados do aluno** em JSON (acesso e portabilidade), só para administração e clínica.
  - **Guarda mínima** sugerida no prontuário (último registro + 20 anos).
- **Falta (depende do Lovable):** tabelas `audit_log` e `consents`, com as regras de acesso abaixo. Depois, os
  adaptadores Supabase para `AuditService` e `ConsentService`.
- **Falta (depende de decisão jurídica):** política de retenção e descarte, texto do termo de consentimento
  e base legal por finalidade. O prazo de 20 anos vem da Lei 13.787/2018, mas as normas do CFP para prontuário
  psicológico e a regra para prontuário eletrônico não foram confirmadas.

> O consentimento hoje é só um registro na interface. Com o banco, a regra precisa ser **aplicada no servidor**
> (RLS e funções do servidor), não só escondendo botões. Em especial, a função de sugestões com IA deve recusar
> a chamada sem consentimento vigente.

## Tabelas a criar

| Tabela      | Campos principais                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `consents`  | student_id → students, purpose (`tratamento`/`escola`/`ia`), guardian, granted_on (date), revoked_on (date, nulo enquanto vigente), term_version |
| `audit_log` | at (timestamptz, default now()), user_id → auth.users, user_email, role, action, resource, student_id (nulo permitido), detail                   |

Integridade: em `consents`, **no máximo um registro vigente** por aluno e finalidade (índice único parcial onde
`revoked_on is null`).

## Acesso (RLS)

- `audit_log`: **inserir** para qualquer usuário autenticado, sempre com `user_id = auth.uid()`; **ler** só
  administradores; **sem update nem delete** para ninguém (nem admin). O horário vem do banco, não do cliente.
- `consents`: ler com `can_see_student(student_id)`; inserir e atualizar (revogar) só `admin` e `clinica`;
  sem delete.

## Pedido para o Lovable (colar no editor)

> Crie as tabelas `consents` e `audit_log` conforme `docs/fase-2-conformidade.md`. Em `audit_log`, permita
> insert para autenticados com `user_id = auth.uid()`, select só para admin e nenhuma política de
> update/delete; use `now()` do banco para `at`. Em `consents`, crie índice único parcial por
> (student_id, purpose) onde `revoked_on is null`, leitura com `can_see_student(student_id)` e
> insert/update só para admin e clínica. Regenere os tipos em `src/integrations/supabase/types.ts`. Além
> disso, faça a função `suggestActivities` recusar a chamada quando não houver consentimento vigente de `ia`
> para o aluno.
