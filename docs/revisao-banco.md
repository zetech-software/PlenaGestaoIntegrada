# Revisão do banco (migrações 0001 a 0003)

Revisão feita rodando as quatro migrações em um Postgres 16 local, com os papéis e o `auth.uid()` do
Supabase simulados (`docs/rls/stubs.sql`), e testando as regras de acesso como administrador, clínica e dois
terapeutas. **Não foi testado contra o banco real do Lovable**: confirme rodando o mesmo script lá (abaixo).

## O que está certo (verificado)

- Terapeuta só vê e edita alunos vinculados a ele; não vê alunos de outro terapeuta.
- Terapeuta não cadastra aluno, não vira admin e não se vincula a outro aluno.
- Financeiro: só administração e clínica leem; ninguém apaga cobrança; cobrança paga exige data e forma.
- Auditoria: só admin lê; ninguém edita nem apaga; `user_id` e horário são forçados pelo servidor.
- Agenda: a mesma pessoa (terapeuta ou aluno) não tem duas sessões sobrepostas; a série semanal é tudo ou nada.
- `has_active_consent` respeita o vínculo do aluno com o usuário.

## O que precisa corrigir

| #   | Problema                                                                                         | Por que importa                                                                          |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | **Terapeuta apaga** registro de prontuário, anamnese e plano de intervenção do próprio aluno     | Conflita com a guarda mínima de 20 anos do prontuário e com a trilha de auditoria        |
| 2   | **Administração ou clínica apaga um aluno** e o `on delete cascade` leva junto todo o prontuário | Mesmo motivo: uma exclusão apaga o histórico clínico inteiro                             |
| 3   | **Consentimento pode ser reescrito**: dá para desfazer a revogação e mudar `granted_on`          | A revogação perde valor de prova; o histórico deveria ser imutável                       |
| 4   | **Não há como listar terapeutas**: `profiles` só é legível pelo próprio usuário ou admin         | A agenda precisa dos nomes para a clínica e para os terapeutas escolherem o profissional |
| 5   | **`user_email` e `role` do evento de auditoria vêm do cliente**                                  | Dá para registrar evento com e-mail e perfil falsos; só `user_id` e `at` são confiáveis  |

Observação de uso (não é defeito): `INSERT ... RETURNING` em `audit_log` falha para quem não é admin, porque
exige permissão de leitura. O app deve gravar eventos **sem** pedir a linha de volta.

## Pedido para o Lovable (colar no editor)

> Faça as correções abaixo no banco e regenere os tipos em `src/integrations/supabase/types.ts`. Depois,
> rode `docs/rls/casos.sh` (veja `docs/revisao-banco.md`) e confirme que todos os casos passam.
>
> 1. Remova as políticas e os grants de DELETE de `record_entries`, `anamneses`, `intervention_plans` e
>    `plan_goals`. Dado clínico não é apagado; mudanças de situação usam o campo `status`.
> 2. Remova a política de DELETE de `students` (para inativar, use `status = 'Inativo'`) e troque os
>    `on delete cascade` que apontam para `students` por `on delete restrict` em `record_entries`,
>    `anamneses`, `intervention_plans`, `consents` e `sessions`.
> 3. Em `consents`, crie um gatilho BEFORE UPDATE que só permita preencher `revoked_on` (de nulo para uma
>    data >= `granted_on`) e recuse qualquer outra alteração, inclusive desfazer a revogação.
> 4. Crie a função `list_therapists()` (security definer, `search_path = public`) que devolve
>    `(id uuid, full_name text)` dos usuários com perfil `terapeuta`, executável por `authenticated`.
>    Não exponha e-mail.
> 5. Em `audit_log`, no gatilho `audit_force_now`, preencha também `user_email` (de `profiles`) e `role`
>    (o maior perfil do usuário: admin > clinica > terapeuta) no servidor, ignorando o que o cliente enviar.

## Como rodar os testes de acesso

Precisa de um Postgres 16 (os binários `initdb`, `pg_ctl` e `psql`).

```bash
# banco de teste (como usuário comum, não root)
initdb -D /tmp/pgdata -A trust && pg_ctl -D /tmp/pgdata -o "-p 54329 -k /tmp -c listen_addresses=''" start
P="psql -h /tmp -p 54329 -U $USER -q -v ON_ERROR_STOP=1"
$P -d postgres -c "create database plena"
$P -d plena -f docs/rls/stubs.sql
for f in drizzle/migrations/000[0-9]*.sql; do $P -d plena -f "$f"; done
$P -d plena -f docs/rls/seed.sql
PSQL="psql -h /tmp -p 54329 -U $USER -d plena" ./docs/rls/casos.sh
```

Para o banco real, aplique só o `seed.sql` em um ambiente de teste (nunca em produção) e rode `casos.sh`
apontando o `PSQL` para ele. O script avisa se o ambiente estiver incompleto, em vez de aprovar sem provar.

Hoje o script falha em 9 casos, todos ligados aos problemas 1 a 5.

## Lado do código (próximo passo, depois das correções)

- Trocar os adaptadores em memória por adaptadores Supabase, com `.insert()` sem `.select()` na auditoria e
  mensagens amigáveis para os erros de conflito de horário.
- Remover o desvio da função de IA para alunos com id que não é UUID (`activities.functions.ts`). Ele existia
  para a demonstração em memória, mas qualquer cliente pode enviar um id inválido para pular a checagem de
  consentimento. Só deve sair junto com a troca dos adaptadores, quando todos os ids passam a ser UUID.
- Trocar a tela de Usuários, que ainda vincula terapeutas a alunos pelos ids de demonstração, para usar
  `student_ref`.
