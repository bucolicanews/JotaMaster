# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Modificado
- **Arquivo(s):** `src/components/Layout.tsx`
- **Descrição da alteração:** Substituição da classe CSS `overflow-x-auto no-scrollbar` por `flex-wrap gap-2` na `nav`.
- **Motivo da mudança:** Os botões do menu ficavam ocultos em dispositivos móveis.

### Modificado
- **Arquivo(s):** `src/pages/Modules.tsx`
- **Descrição da alteração:** Implementada conexão via Supabase SDK para consultar a tabela `installed_modules`.
- **Motivo da mudança:** Refletir dinamicamente a arquitetura de acesso a plugins do SaaS.

### Adicionado
- **Arquivo(s):** `docs/04-INTEGRACAO_MODULOS_SUPABASE.md` e `docs/05-IMPLEMENTACAO_AUTH_SUPABASE.md`
- **Descrição da alteração:** Criada documentação formal detalhando o fluxo de dados e segurança do módulo.

### Substituído (Segurança - AppSec)
- **Arquivo(s):** `src/contexts/AuthContext.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/Login.tsx` (Novo), `src/lib/auth.ts` (Removido)
- **Descrição da alteração:** Migração completa da autenticação fake baseada em LocalStorage (senha `Jota1@@jota79`) para a API oficial do Supabase Auth. Adição da biblioteca `@supabase/auth-ui-react`.
- **Motivo da mudança:** Necessidade de obtenção de um token JWT válido para transpor as políticas de segurança de linha (RLS) da tabela `installed_modules` e de futuros módulos sensíveis.

### Modificado (UX/UI)
- **Arquivo(s):** `src/pages/Login.tsx`, `docs/05-IMPLEMENTACAO_AUTH_SUPABASE.md`
- **Descrição da alteração:** Correção das cores (constraste) e aplicação do idioma Português (pt-BR) aos rótulos e links do componente `<Auth />` do Supabase.
- **Motivo da mudança:** O texto estava se misturando com o fundo, e as ações nativas (Sign up, Forgot password) estavam em inglês. Os estilos Tailwind do projeto foram injetados no Auth UI.