# Fase 3 — rotina da clínica

## Estado

- **Feito no código (demonstração, em memória):**
  - **Agenda:** repetição semanal (até 12 semanas, tudo ou nada); **conflito de horário por terapeuta e por
    aluno** (antes qualquer sessão bloqueava o horário, mesmo de outro terapeuta); **lista de espera** por
    especialidade e período; **lembrete de confirmação** por WhatsApp (link com nome, data e horário, sem dado
    clínico; telefone inválido ou fictício aparece como "Sem telefone").
  - **PEI para a escola:** botão "Compartilhar com a escola" no PEI, que só habilita com consentimento
    vigente do tipo `escola`. Gera uma versão para imprimir/PDF **sem resumo clínico nem área de
    atuação**, com a referência ao consentimento, e registra o evento na auditoria. PTI não é compartilhável.
  - **Financeiro básico** (`/financeiro`, só admin e clínica): cobranças com vencimento, situação (em aberto,
    atrasado, pago, cancelado), baixa com forma de pagamento, totais (a receber, em atraso, recebido no
    mês) e relatório financeiro em PDF. Valores em centavos. **Não processa pagamentos.**
- **Falta (depende do Lovable):** as tabelas abaixo e as regras de acesso. Depois, os adaptadores Supabase para
  os serviços de agenda, lista de espera e financeiro.
- **Fora desta fase, de propósito:**
  - **Portal da família:** exige um perfil novo (responsável), login próprio e regras de acesso por aluno no
    banco. Fazer na interface sem isso seria só uma vitrine. Depende do esquema da Fase 1 e do consentimento
    da Fase 2 já aplicados no servidor.
  - **Salas:** exige um cadastro de salas e a escolha da sala na sessão; o conflito por sala entra junto com
    a tabela de sessões do banco.
  - **Lembrete automático:** o link do WhatsApp é manual. Envio automático exige integração e base legal
    próprias.
  - **Convênio/TISS** e **pacotes de sessões:** dependem de validar com as clínicas se fazem sentido.

## Tabelas a criar

| Tabela             | Campos principais                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `waitlist_entries` | student_id → students, specialty, period (`Manhã`/`Tarde`/`Qualquer`), notes, status (`Aguardando`/`Agendado`), created_on                                                            |
| `charges`          | student_id → students, description, amount_cents (integer, check > 0), due_date, status (`Em aberto`/`Pago`/`Cancelado`), paid_on, method (`PIX`/`Dinheiro`/`Cartão`/`Transferência`) |

Integridade:

- `charges`: `paid_on` e `method` só preenchidos quando `status = 'Pago'`; **sem apagar**, só cancelar.
- `sessions` (da Fase 1): impedir sobreposição para o **mesmo terapeuta** e para o **mesmo aluno** entre sessões
  não canceladas (exclusion constraint com intervalo de tempo). A série semanal deve ser criada em uma
  transação única, tudo ou nada.
- `waitlist_entries`: um aluno só aparece uma vez por especialidade enquanto `Aguardando` (índice único parcial).

## Acesso (RLS)

- `charges`: **só `admin` e `clinica`** leem e escrevem; terapeuta não vê financeiro. Sem delete.
- `waitlist_entries`: leitura e escrita com `can_see_student(student_id)`.
- Eventos de financeiro e de compartilhamento com a escola entram em `audit_log` (Fase 2).

## Pedido para o Lovable (colar no editor)

> Crie as tabelas `waitlist_entries` e `charges` conforme `docs/fase-3-rotina.md`. Em `charges`, permita
> select/insert/update apenas para admin e clínica e nenhuma política de delete. Em `waitlist_entries`, use
> `can_see_student(student_id)`. Em `sessions`, adicione exclusion constraints para impedir sobreposição de
> horário do mesmo terapeuta e do mesmo aluno quando o status não for `Cancelado`. Regenere os tipos em
> `src/integrations/supabase/types.ts`.
