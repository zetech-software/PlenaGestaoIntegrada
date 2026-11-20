# Fase 1 — dados persistentes

## Estado

- **Feito no código:** os quatro serviços de dados (`StudentService`, `SessionService`, `RecordService`,
  `PlanService`) são assíncronos, com interface em `src/types/*` e provider em `src/hooks/use-*.tsx`
  (TanStack Query). As telas já tratam carregamento e erro. Trocar o adaptador em memória por um adaptador
  de banco não exige mexer nas telas.
- **Falta (depende do Lovable):** criar as tabelas e as políticas de acesso (RLS). O `AGENTS.md` pede que
  mudanças de esquema sejam feitas no Lovable, não à mão em `supabase/migrations/` ou `drizzle/`. Hoje só
  existem `profiles`, `user_roles` e `student_assignments`.
- **Depois do esquema:** escrever os adaptadores Supabase (um por serviço) e testá-los contra o banco.

> Não ligar dados reais de crianças antes da Fase 2 (auditoria de acesso, consentimento do responsável e
> política de retenção). Até lá, o banco deve receber só dados fictícios.

## Tabelas a criar

Todas com `id uuid primary key default gen_random_uuid()`, `created_at`/`updated_at timestamptz` e RLS
ligada. Datas de calendário como `date`; horário como `time`.

| Tabela               | Campos principais (espelham `src/types/*`)                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `students`           | name, birth_date, school, grade, guardian, relationship, phone, email, status (`Ativo`/`Em avaliação`/`Inativo`), start_date, notes, tone                   |
| `sessions`           | student_id → students, therapist_id → profiles, date, start (time), duration (min), type, status (`Pendente`/`Confirmado`/`Realizado`/`Faltou`/`Cancelado`) |
| `anamneses`          | student_id (**único**), specialty, main_complaint, referral, gestation, development, health, family, school, expectations                                   |
| `record_entries`     | student_id, date, specialty, objectives, activities, observations, evolution (`Avançou`/`Estável`/`Precisa de atenção`), next_steps                         |
| `intervention_plans` | student_id, kind (`PEI`/`PTI`), title, specialty, start_date, review_date, status (`Rascunho`/`Ativo`/`Concluído`), summary                                 |
| `plan_goals`         | plan_id → intervention_plans (on delete cascade), description, strategy, deadline, progress (0–100, check), position                                        |

Regras de integridade: conflito de horário por terapeuta (índice ou `exclude constraint` em
`sessions` para sessões não canceladas); `review_date >= start_date`; prazo da meta dentro do período do plano.

## Acesso (RLS)

Reaproveitar `has_role` e `student_assignments`. Criar uma função
`can_see_student(_student_id uuid)`: verdadeira para `admin` e `clinica`, e para `terapeuta` apenas se
houver vínculo em `student_assignments`. Todas as tabelas com `student_id` usam essa função em
`select`, `insert`, `update` e `delete`; `plan_goals` herda pelo plano. Só `admin` e `clinica` cadastram
e apagam alunos.

Ponto de atenção: `student_assignments.student_id` hoje é `text` (ids de demonstração como `"1"`). Ao migrar
para `students.id uuid`, o vínculo precisa passar a referenciar `students(id)`.

## Pedido para o Lovable (colar no editor)

> Crie as tabelas `students`, `sessions`, `anamneses`, `record_entries`, `intervention_plans` e
> `plan_goals`, conforme `docs/fase-1-banco.md` neste repositório. Ative RLS em todas, crie a função
> `can_see_student(uuid)` (admin e clínica veem tudo; terapeuta só os alunos em `student_assignments`) e use
> essa função nas políticas de todas as tabelas com `student_id`. Troque `student_assignments.student_id`
> para referenciar `students(id)`. Não insira dados reais; se precisar de dados de exemplo, use os
> fictícios de `src/data/demo-*.ts`. Regenere os tipos em `src/integrations/supabase/types.ts`.
