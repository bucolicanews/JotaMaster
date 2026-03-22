# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Modificado (Administração de Módulos)
- **Arquivo(s):** `src/pages/AdminDashboard.tsx`, `docs/16-SEGURANCA_GESTAO_URLS.md`
- **Descrição da alteração:** Atualização da tabela do Marketplace para permitir edição do tipo de módulo (`internal` vs `iframe`) e a respectiva `bundle_url`.
- **Motivo da mudança:** Completar o ciclo de arquitetura de Micro-Frontends permitindo gestão visual das URLs, sem depender de scripts SQL manuais.
- **Impactos Esperados:** O administrador pode plugar novos módulos externos instantaneamente.
- **Impactos Potenciais (Riscos):** Injeção de URLs maliciosas. 
- **Mitigação:** Adição de validação estrita exigindo protocolo `https://`.

### Adicionado (Documentação de Integração)
- **Arquivo(s):** `docs/15-GUIA_DESENVOLVEDOR_MODULOS.md`
- **Descrição da alteração:** Criação de manual de integração para desenvolvedores parceiros criarem módulos compatíveis com a arquitetura de iframe do Jota Master.

### Adicionado (Motor de Micro-Frontends)
- **Arquivo(s):** `src/components/DynamicModuleLoader.tsx`, `src/pages/DynamicRouteHandler.tsx`, `docs/14-DYNAMIC_MODULE_LOADER.md`
- **Descrição da alteração:** Implementação do motor de injeção de iframes sandboxados e roteamento genérico `/app/:moduleId`.
- **Motivo da mudança:** Capacitar o Jota Master a rodar aplicações hospedadas em CDNs de terceiros com segurança Zero Trust.

### Modificado (Integração Marketplace)
- **Arquivo(s):** `src/pages/Modules.tsx`, `src/App.tsx`
- **Descrição da alteração:** Atualização do sistema de roteamento para diferenciar módulos nativos (`internal`) de módulos externos (`iframe`).

### Adicionado (Arquitetura e Governança)
- **Arquivo(s):** `docs/13-MODELO_DADOS_MICRO_FRONTENDS.md`
- **Descrição da alteração:** Adição da documentação técnica e avaliação de risco (AppSec) para o novo modelo de dados do catálogo de módulos.