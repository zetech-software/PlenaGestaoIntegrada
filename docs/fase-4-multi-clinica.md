# Painel da plataforma e multi-clínica

## Estado

> **Atualização:** o isolamento por clínica foi aplicado (migrações `0005` a `0008`) e o painel de clientes
> agora usa o banco: o cadastro passa pela função de servidor `provisionTenant`, que convida o responsável por
> e-mail. As regras de acesso foram testadas em um Postgres local (`docs/rls/casos.sh`, 55 casos, inclusive 13
> tentativas de furar o isolamento). **Ainda não foi exercitado com um Supabase real:** o envio do convite e o
> aceite do convite precisam de um teste de ponta a ponta. A função de servidor também passou a conferir os dígitos
> do CPF/CNPJ, não só o tamanho. O texto abaixo é o plano original.

- **Feito no código (demonstração, em memória):** o painel `/plataforma` ("Clientes"), exclusivo de um novo perfil,
  o **operador da plataforma**. Cadastra **clínica** (CNPJ, vagas de profissionais) ou **profissional autônomo**
  (CPF, registro profissional, uma vaga), com validação dos dígitos do CPF e do CNPJ, bloqueio de documento e
  e-mail repetidos, situação (em implantação, ativo, suspenso), busca, filtros e resumo (clínicas, autônomos,
  ativos, vagas).
- **Separação de funções:** o operador **só abre o painel de clientes**. Todas as áreas clínicas (alunos, agenda,
  prontuários, financeiro etc.) ficam fechadas para ele, e a conta de operador **nunca** herda outro perfil. O
  administrador de uma clínica não vê o painel, não atribui o perfil de operador (a tela de Usuários e a função
  que cria usuários só aceitam admin, clínica e terapeuta) e não vê contas de operador na sua lista.
- **O que o painel ainda NÃO faz:** o cadastro não cria o login do responsável nem envia convite, e **não há
  isolamento de dados entre clientes**. Hoje o banco é de uma única clínica. Cadastrar um cliente no painel não dá
  acesso a nada: só vira realidade com o que está abaixo.

> Não cadastrar clientes reais de verdade antes do isolamento por clínica. Com o banco atual, todos os usuários
> compartilhariam os mesmos alunos.

## O que falta: isolamento por clínica (tenant)

É a mudança mais sensível do projeto: toca todas as tabelas e todas as regras de acesso. Por isso é uma decisão de
arquitetura, não só uma tela.

**Recomendação: um banco, com `tenant_id` em toda tabela e RLS por tenant.** É o mais simples de operar e de
evoluir. A alternativa (um projeto de banco por cliente) isola mais, mas multiplica migrações, custo e suporte.

### Esquema

- Tabela `tenants`: id, kind (`clinica`/`autonomo`), name, document (único), owner_name, owner_email (único), phone,
  registration, seats (1 a 200; autônomo sempre 1), status (`Em implantação`/`Ativo`/`Suspenso`), created_on.
- `profiles.tenant_id` (nulo só para o operador). Novo valor `plataforma` no enum `app_role`.
- `tenant_id uuid not null` em `students`, `sessions`, `anamneses`, `record_entries`, `intervention_plans`,
  `consents`, `audit_log`, `waitlist_entries`, `charges` e `student_assignments`. `plan_goals` herda do plano.
- **Migração dos dados existentes:** antes do `not null`, criar um tenant "piloto" e apontar tudo para ele.

### Funções e regras de acesso (RLS)

- `current_tenant_id()` (security definer): o tenant do usuário logado; **nulo para o operador**.
- `is_platform_operator()`: o usuário tem o perfil `plataforma`.
- `tenant_is_active()`: o tenant do usuário não está suspenso.
- Toda política das tabelas clínicas passa a exigir `tenant_id = current_tenant_id()` **e** `tenant_is_active()`,
  somando-se às regras atuais (`can_see_student`, `is_staff`). Como o operador tem `current_tenant_id()` nulo, a
  comparação nunca é verdadeira: **o operador não lê nenhuma linha clínica**.
- `tenants`: o operador lê e escreve tudo; o administrador de uma clínica lê só o próprio registro (nome, vagas,
  situação); ninguém apaga tenant.
- `has_role` e `is_staff` precisam ser lidos **sempre junto do tenant**: um admin da clínica A não pode ser admin da B.
- **Vagas:** gatilho que recusa criar usuário acima de `seats`.
- **Suspensão** bloqueia o acesso, mas **mantém os dados** (a guarda do prontuário continua valendo).

### Criação do cliente (função de servidor)

`provisionTenant` com a chave de serviço, chamável só pelo operador (checagem de `has_role`, como a função que cria
usuários). Em uma operação: cria o tenant, convida o responsável por e-mail, cria o perfil com `tenant_id` e atribui
o perfil `admin`; para **autônomo**, atribui `admin` e `terapeuta` (ele é a própria clínica e atende). Se o convite
falhar, desfaz o tenant. O painel passa a chamar essa função em vez do cadastro em memória.

### O que não é código

- **LGPD:** a clínica é a controladora dos dados dos pacientes; a plataforma é operadora. Precisa de contrato
  (termos de uso e acordo de tratamento de dados) e de uma regra de suporte: o operador **não** acessa dado
  clínico, e acesso excepcional precisa de autorização do cliente e registro.
- **Cobrança da assinatura, planos e limites:** não existem; as vagas são o único limite.
- **Texto do termo de consentimento por clínica:** cada clínica tem o seu.

## Pedido para o Lovable (colar no editor)

> Implemente multi-clínica conforme `docs/fase-4-multi-clinica.md`, em duas etapas, e rode
> `docs/rls/casos.sh` ao final (acrescente os casos de isolamento entre clínicas):
>
> 1. Crie a tabela `tenants`, adicione `plataforma` ao enum `app_role` e `tenant_id` em `profiles` e nas
>    tabelas clínicas. Crie um tenant piloto, aponte todos os dados e usuários atuais para ele e só então
>    torne `tenant_id` obrigatório.
> 2. Crie `current_tenant_id()`, `is_platform_operator()` e `tenant_is_active()` e reescreva as políticas para
>    exigir `tenant_id = current_tenant_id()` e tenant ativo, além das regras atuais. O operador não pode ler
>    nenhuma tabela clínica. Crie o gatilho de vagas e a função de servidor `provisionTenant` (só operador).
>    Regenere os tipos em `src/integrations/supabase/types.ts`.

## Testes a escrever junto com a migração

Casos de isolamento para `docs/rls/casos.sh`: admin da clínica A não vê alunos, sessões, cobranças nem auditoria da
B; terapeuta da A não vê nada da B; operador lê `tenants` mas **zero** linhas clínicas; tenant suspenso não lê
nada; criar usuário acima das vagas falha; admin de uma clínica não consegue atribuir `plataforma` nem alterar o
próprio `tenant_id`. Escrevê-los exige o esquema novo, então ficam para quando a migração existir.
