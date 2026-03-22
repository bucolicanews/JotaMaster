# Motor de Injeção / Dynamic Module Loader

## Descrição
Componente e Roteador responsáveis por carregar e injetar Micro-Frontends (Blocos de Lego externos) de forma dinâmica e segura dentro do Jota Master (Placa-mãe).

## Entradas
- Rota: `/app/:moduleId`
- Banco de Dados: `system_modules` (Trazendo `bundle_url` e `module_type`).
- Permissão: `installed_modules` (Validação de acesso do Locatário).

## Saídas
- Componente `<DynamicModuleLoader url={bundle_url} />`.
- Renderização de um Iframe Sandboxado.

## Fluxo
1. Usuário clica em "Acessar Módulo" na loja (`/modules`).
2. O sistema verifica o tipo. Se for externo, navega para `/app/:moduleId`.
3. O `DynamicRouteHandler` assume a rota, consulta o Supabase e cruza a permissão do usuário.
4. Se autorizado, o `DynamicRouteHandler` chama o `DynamicModuleLoader`.
5. O loader injeta o Iframe com a política `sandbox` ativada, impedindo escape de contexto.

## Dependências
- `react-router-dom` (useParams, Navigate)
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/client.ts`

## Chamado por
- `src/App.tsx` (Roteamento Catch-All Dinâmico).

## Riscos / Observações
- **Risco (Clickjacking / Escape):** Módulo tentar dominar a aba principal.
- **Mitigação:** Atributo `sandbox` OBRIGATÓRIO no iframe. A ausência de `allow-top-navigation` paralisa ataques de redirecionamento.
- **Risco (Downtime):** CDN do módulo terceiro cair.
- **Mitigação:** Componente exibe Loader e trata eventos de `onError` do Iframe com Fallback visual gracioso.

## Histórico de Alterações
- Data: 2024 (Sessão Atual)
- Alteração: Criação da infraestrutura de Micro-Frontends.
- Motivo: Desacoplamento da arquitetura SaaS.