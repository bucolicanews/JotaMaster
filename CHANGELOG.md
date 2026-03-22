# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Adicionado (Arquitetura e Governança)
- **Arquivo(s):** `docs/13-MODELO_DADOS_MICRO_FRONTENDS.md`
- **Descrição da alteração:** Adição da documentação técnica e avaliação de risco (AppSec) para o novo modelo de dados do catálogo de módulos.
- **Motivo da mudança:** Preparar a infraestrutura de dados para suportar a injeção de Micro-Frontends de forma segura e rastreável.
- **Impactos Esperados:** Suporte nativo a URLs de módulos externos via CDN.
- **Impactos Potenciais (Riscos):** Injeção de XSS caso a URL não seja tratada via Iframe com `sandbox`. Mitigado via RLS de banco de dados.

### Adicionado (Governança Módulos)
- **Arquivo(s):** `docs/PROMPT_CRIACAO_MODULO_CRM.md`, `docs/12-ARQUITETURA_MICRO_FRONTENDS.md`
- **Descrição da alteração:** Criação de manuais e arquitetura de injeção dinâmica de módulos externos (micro-frontends) acoplados ao Jota Master.
- **Motivo da mudança:** Garantir que a plataforma possa escalar com módulos independentes sob rigoroso padrão Zero Trust.

### Corrigido (Estabilidade e Segurança)
- **Arquivo(s):** `src/pages/AdminDashboard.tsx`, `docs/08-SEGURANCA_ADMINDASHBOARD.md`
- **Descrição da alteração:** Refatoração das consultas ao banco de dados no painel do administrador. 

### Adicionado (Governança e AppSec)
- **Arquivo(s):** `docs/07-POLITICAS_DE_GOVERNANCA.md`
- **Descrição da alteração:** Adoção formal de regras estritas de validação técnica e segurança.

### Modificado
- **Arquivo(s):** `src/components/Layout.tsx`
- **Descrição da alteração:** Substituição do menu superior por Sidebar lateral com indicação visual de Role.