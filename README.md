# Plena Gestão Integrada

Plataforma de gestão para acompanhar o desenvolvimento, a aprendizagem e o cuidado de alunos e pacientes
(neuropsicopedagogia e áreas afins), por Ze Tech.

> **Versão demonstrativa.** Alunos, agenda, prontuários e planos ficam em memória e somem ao recarregar a
> página. Use apenas dados fictícios. Só contas e perfis de acesso são guardados (Lovable Cloud).

## Módulos

- **Painel:** total de alunos, sessões pendentes e frequência por terapeuta.
- **Alunos** e perfil, com ficha em PDF.
- **Agenda e sessões:** status, frequência e bloqueio de conflito de horário.
- **Prontuários:** anamnese multidisciplinar e evolução por sessão.
- **Intervenções:** planos PEI/PTI com metas, prazos e progresso.
- **Relatórios:** frequência por terapeuta, alunos e planos, com exportação em PDF com a marca Plena.
- **Usuários, perfis** (administrador, clínica, terapeuta) e **configurações** (logo).

## Stack

TanStack Start + Router (React 19, TypeScript), Vite, Tailwind 4, shadcn/ui, TanStack Query,
Vitest. Gerenciador de pacotes: [Bun](https://bun.sh).

## Desenvolvimento

```sh
bun install
bun run dev
```

| Comando             | O que faz                                                      |
| ------------------- | -------------------------------------------------------------- |
| `bun run lint`      | ESLint + Prettier (arquivos gerados do Supabase ficam de fora) |
| `bun run typecheck` | Verificação de tipos (`tsc --noEmit`)                          |
| `bun run test`      | Testes (Vitest)                                                |
| `bun run build`     | Build de produção                                              |

A integração contínua (`.github/workflows/ci.yml`) roda esses quatro comandos em cada pull request.

## Variáveis de ambiente do servidor

- `LOVABLE_API_KEY`: chave da IA (gerenciada pelo Lovable; nunca no código do navegador).
- `AI_ALLOW_DEMO_STUDENTS`: `true` libera a IA para alunos de demonstração em memória (sem consentimento
  verificável no servidor). Deixe desligada em produção. Veja `AGENTS.md`.

## Arquitetura

As regras de arquitetura do projeto estão em [`AGENTS.md`](./AGENTS.md). Planejamento por fases em
[`roadmap.md`](./roadmap.md).

## Lovable

Este projeto está conectado ao [Lovable](https://lovable.dev/projects/608dc163-bfe5-49ed-a19a-fea79eba1fe7):
mudanças feitas lá são commitadas neste repositório e mudanças na `main` voltam para o editor. Evite reescrever
o histórico já publicado.
