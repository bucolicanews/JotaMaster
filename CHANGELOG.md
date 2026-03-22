# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Corrigido (Estabilidade e Segurança)
- **Arquivo(s):** `src/pages/AdminDashboard.tsx`, `docs/08-SEGURANCA_ADMINDASHBOARD.md`
- **Descrição da alteração:** Refatoração das consultas ao banco de dados no painel do administrador. Substituição de Join direto no Supabase por consultas separadas unidas em memória.
- **Motivo da mudança:** Prevenir o erro 400 (Bad Request) causado por ausência de Foreign Key explícita no cache do PostgREST.
- **Impactos e Riscos:** Melhora a estabilidade geral da página. Mitiga falhas de exibição se a tabela `installed_modules` for alterada no futuro.

### Adicionado (Governança e AppSec)
- **Arquivo(s):** `docs/07-POLITICAS_DE_GOVERNANCA.md`
- **Descrição da alteração:** Adoção formal de regras estritas de validação técnica, documentação contínua em `.md` e protocolos de segurança (Zero Trust, Fail Safe, Input Validation).
- **Motivo da mudança:** Garantir a escalabilidade, segurança contra vulnerabilidades (OWASP Top 10) e rastreabilidade total do código-fonte do Jota Master.

### Modificado
- **Arquivo(s):** `src/components/Layout.tsx`
- **Descrição da alteração:** Substituição do menu superior por Sidebar lateral com indicação visual de Role.
- **Motivo da mudança:** Melhoria de UX e clareza hierárquica.