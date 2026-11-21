# Primeira entrega

## Assistente de WhatsApp para leads
- [ ] Conectar número WhatsApp Business e verificar recebimento de mensagens
- [ ] Definir serviços/planos e preços autorizados para orçamento (aguarda resposta)
- [ ] Definir horários disponíveis e responsável pela transferência das conversas
- [ ] Atendimento automático com histórico, orçamento, reserva persistente de horário e transferência humana
- [ ] Validar mensagem real, orçamento, agendamento e transferência de ponta a ponta

## Rotina de agendamento
- [x] Reunião com os pais: tipo próprio, data, horário, duração e responsável do aluno
- [x] Sessão dupla de 90 minutos para o mesmo aluno e sessão conjunta com dois profissionais
- [x] Validar agendamento, leitura na agenda e bloqueio de conflito (conta clínica no navegador; 27 testes; demonstração em memória)

## Administração da equipe da clínica
- [x] Consulta com busca e filtros; quadro de permissões por perfil
- [x] Alteração segura de perfil e vínculos, com confirmação e retorno de erros
- [x] Verificação com administrador temporário da clínica: perfil e vínculo gravados e relidos; computador/celular; 9 testes de acesso

## Painel do terapeuta e troca de conta
- [x] Painel próprio com agenda e alunos vinculados, sem e-mails
- [x] Sair e entrar com outra conta na tela de acesso negado
- [x] Validar acesso do terapeuta e troca de conta (12 testes; navegador com terapeuta vinculado, calendário, celular e saída sem restauração de dados)

- [x] Design System e layout principal
- [x] Dashboard demonstrativo
- [x] Listagem e filtros de alunos
- [x] Cadastro demonstrativo e perfil do aluno
- [x] Navegação, testes e verificação em computador e tablet

# Segunda fase — Agenda e Sessões

- [x] Calendário por horário (dia, semana e mês), alunos e padrão de 45 minutos; testado com profissional em computador, tablet e celular
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
