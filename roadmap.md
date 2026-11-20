# Primeira entrega

- [x] Design System e layout principal
- [x] Dashboard demonstrativo
- [x] Listagem e filtros de alunos
- [x] Cadastro demonstrativo e perfil do aluno
- [x] Navegação, testes e verificação em computador e tablet

# Segunda fase — Agenda e Sessões

- [x] Agenda semanal, novo atendimento com bloqueio de conflito, status e frequência
- [x] Painel lê os atendimentos do dia da agenda

# Terceira fase — Registros e acesso

- [x] Anamnese multidisciplinar (demonstração)
- [x] Prontuário com sessões e linha de evolução (demonstração)
- [x] Tela de login e e-mail de teste

# Quarta fase — Usuários e perfis

- [x] Tela de Usuários (admin) e perfis admin, terapeuta, clínica com acesso por menu e alunos

# Quinta fase — Intervenções e Relatórios

- [x] Plano de Intervenção PEI/PTI com metas, prazos, progresso e situação
- [x] Relatórios (frequência por terapeuta, alunos e planos) com exportação em PDF com a marca Plena
- [x] Painel inicial com total de alunos, sessões pendentes e frequência por terapeuta

# Sexta fase — Dados persistentes (em andamento)

- [x] Serviços de alunos, sessões, registros e planos assíncronos, com carregamento e erro nas telas
- [ ] Tabelas e regras de acesso (RLS) no Lovable — ver `docs/fase-1-banco.md`
- [ ] Adaptadores Supabase para cada serviço

# Sétima fase — Confiança e conformidade (em andamento)

- [x] Consentimento do responsável por finalidade (tratamento, escola, IA), com revogação e histórico
- [x] Auditoria de acesso (admin) e exportação dos dados do aluno em JSON
- [x] Guarda mínima sugerida no prontuário
- [ ] Tabelas `consents` e `audit_log` com RLS no Lovable — ver `docs/fase-2-conformidade.md`
- [ ] Política de retenção, texto do termo e base legal, com assessoria jurídica

# Oitava fase — Rotina da clínica (em andamento)

- [x] Agenda: repetição semanal, conflito por terapeuta e aluno, lista de espera e lembrete por WhatsApp
- [x] PEI para a escola (com consentimento) e financeiro básico com relatório
- [ ] Tabelas e regras de acesso no Lovable — ver `docs/fase-3-rotina.md`
- [ ] Portal da família e salas (dependem do banco)

# Nona fase — Painel da plataforma e multi-clínica (em andamento)

- [x] Painel de clientes (clínica ou profissional autônomo) para o operador da plataforma, com separação de funções
- [x] Isolamento por clínica no banco (tenant) e criação do cliente com convite — ver `docs/fase-4-multi-clinica.md`
- [ ] Contrato, termos de uso e regra de suporte (LGPD)

Demais módulos aguardam validação desta entrega. Sem banco permanente, dados reais ou funcionalidades clínicas sensíveis.

## Plataforma (nov/2026)
- [x] Relatório receita/custo/margem por plano no Dashboard
- [x] Cobrança integrada (teste) com renovação automática
- [ ] Lembretes de vencimento por e-mail (aguarda domínio de e-mail)
- [ ] Cadastrar clínica nova com convite real (aguarda nome/e-mail)
