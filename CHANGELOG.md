# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Adicionado (Motor de Micro-Frontends)
- **Arquivo(s):** `src/components/DynamicModuleLoader.tsx`, `src/pages/DynamicRouteHandler.tsx`, `docs/14-DYNAMIC_MODULE_LOADER.md`
- **Descrição da alteração:** Implementação do motor de injeção de iframes sandboxados e roteamento genérico `/app/:moduleId`.
- **Motivo da mudança:** Capacitar o Jota Master a rodar aplicações hospedadas em CDNs de terceiros com segurança Zero Trust.
- **Impactos Esperados:** Módulos de terceiros agora rodarão em abas seguras dentro do sistema.
- **Impactos Potenciais (Riscos):** Iframes dependem da estabilidade da CDN de origem.

### Modificado (Integração Marketplace)
- **Arquivo(s):** `src/pages/Modules.tsx`, `src/App.tsx`
- **Descrição da alteração:** Atualização do sistema de roteamento para diferenciar módulos nativos (`internal`) de módulos externos (`iframe`).

### Adicionado (Arquitetura e Governança)
- **Arquivo(s):** `docs/13-MODELO_DADOS_MICRO_FRONTENDS.md`
- **Descrição da alteração:** Adição da documentação técnica e avaliação de risco (AppSec) para o novo modelo de dados do catálogo de módulos.
- **Motivo da mudança:** Preparar a infraestrutura de dados para suportar a injeção de Micro-Frontends de forma segura e rastreável.