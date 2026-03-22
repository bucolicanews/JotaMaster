# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Modificado
- **Arquivo(s):** `src/components/Layout.tsx`
- **Descrição da alteração:** Substituição da classe CSS `overflow-x-auto no-scrollbar` por `flex-wrap gap-2` na `nav`.
- **Motivo da mudança:** Os botões do menu ficavam ocultos em dispositivos móveis e não havia indicação visual de que a barra era rolável, comprometendo a experiência Mobile-First e dificultando o acesso ao novo botão "Central de Módulos".
- **Impactos esperados:** O menu se quebrará em várias linhas conforme a largura da tela, exibindo sempre todas as rotas autorizadas.

### Modificado
- **Arquivo(s):** `src/pages/Modules.tsx`
- **Descrição da alteração:** Implementada conexão via Supabase SDK para consultar a tabela `installed_modules`.
- **Motivo da mudança:** Refletir dinamicamente a arquitetura de acesso a plugins do SaaS.
- **Impactos esperados:** Consulta ao backend na montagem da tela.
- **Impactos potenciais (Riscos):** Conflito identificado. Como a autenticação atual é local (`auth.ts`), a query falha na segurança de linha (RLS). A função possui tratamento de erro (Fail Safe) para utilizar os dados mockados no caso de ausência do JWT do Supabase.

### Adicionado
- **Arquivo(s):** `docs/04-INTEGRACAO_MODULOS_SUPABASE.md`
- **Descrição da alteração:** Criada documentação formal detalhando a função de busca de módulos no banco de dados.