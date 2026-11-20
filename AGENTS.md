<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep the shared application shell and in-memory student provider around the root Outlet so navigation preserves a demo session without persistent storage.
- Keep student types, fixture data, service adapters, hooks and visual components in separate modules; future REST adapters implement StudentService without changing the presentation layer.
- Put demo filtering and date calculations in browser-safe service utilities and test them independently; do not add server logic for a demonstration-only delivery.
- Give each content page its own file route and metadata; deferred modules are disabled navigation entries rather than placeholder pages.
- Auth gate lives in the root route around the app shell (inline login screen); Lovable Cloud only stores accounts, while student, agenda and record data stay in in-memory demo services until the REST backend exists.
- Student sub-pages (anamnese, prontuário) use un-nested `$id_` routes so they render as full pages independent of the profile.
- Access rules live in pure helpers in src/services/permissions.ts; roles and therapist-student links are stored in Lovable Cloud with RLS, and only a server function using the admin client (after a has_role check) creates accounts.
- Planos de intervenção (PEI/PTI) e relatórios seguem o mesmo padrão em memória: tipos, dados fictícios, serviço puro testável e provider; o vínculo terapeuta–aluno dos relatórios e do painel vem de `src/data/demo-therapists.ts` até existir um serviço real. A exportação em PDF usa a impressão do navegador com `PrintHeader`/`PrintFooter` (marca Plena).
- O operador da plataforma (perfil `plataforma`) só abre `/plataforma` e nunca recebe perfil clínico; o perfil não é atribuível pela tela de Usuários nem pela função que cria usuários (use `ClinicRole`, não `AppRole`, nesses pontos). Isolamento por clínica (tenant) é regra de banco, descrita em `docs/fase-4-multi-clinica.md`.
