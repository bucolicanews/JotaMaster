# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Modificado (Curadoria de IA pelo Admin)
- **Arquivo(s):** `src/pages/Configuracao.tsx`, `docs/19-CURADORIA_IA_ADMIN.md`
- **Descrição da alteração:** Refatoração da tela de configurações para permitir que o Administrador visualize, edite e torne global (público) qualquer Agente, Prompt ou Skill criada pelos usuários.
- **Motivo da mudança:** Viabilizar moderação e promoção de conteúdo colaborativo.
- **Impactos Esperados:** Admins terão controle total sobre a IA do SaaS, podendo compartilhar boas criações com a base inteira.
- **Impactos Potenciais (Riscos):** Falha de RLS ao tentar gravar dados de terceiros.
- **Mitigação:** Atualização das políticas de segurança do Supabase para injetar `get_user_role() = 'admin'` no escopo de checagem.

### Modificado (Administração de Módulos)
- **Arquivo(s):** `src/pages/AdminDashboard.tsx`, `docs/16-SEGURANCA_GESTAO_URLS.md`
- **Descrição da alteração:** Atualização da tabela do Marketplace para permitir edição do tipo de módulo (`internal` vs `iframe`) e a respectiva `bundle_url`.
- **Motivo da mudança:** Completar o ciclo de arquitetura de Micro-Frontends permitindo gestão visual das URLs, sem depender de scripts SQL manuais.