# Módulo de Autenticação - Supabase (AppSec)

## Descrição
Substituição da lógica de autenticação local (fake login com senha hardcoded) pela infraestrutura oficial de Identity and Access Management (IAM) do Supabase. Essa mudança habilita a segurança de acesso a nível de banco de dados (Row Level Security - RLS).

## Entradas
- Credenciais do usuário (Email e Senha) inseridas na tela `/login`.
- Tokens JWT gerados pelo Supabase.

## Saídas
- Contexto global `AuthContext` distribuindo os estados `autenticado` (boolean), `session` (Supabase Session) e `isLoading` (boolean).

## Fluxo
1. Usuário acessa uma Rota Protegida (ex: `/modules`).
2. O componente `RotaProtegida` verifica o status de `isLoading`. Se `true`, exibe tela de loading.
3. Após carregamento do `onAuthStateChange`, se `session` for nula, o usuário é redirecionado para `/login`.
4. Em `/login`, o usuário utiliza o componente `<Auth />` oficial do `@supabase/auth-ui-react` para autenticar.
5. O Supabase emite o evento de SignIn, atualizando o contexto e liberando o acesso ao App.
6. Queries disparadas para o banco a partir deste momento terão o JWT real anexado nos headers, passando pelo crivo do RLS.

## Dependências
- `@supabase/supabase-js`
- `@supabase/auth-ui-react`
- `@supabase/auth-ui-shared`
- `src/integrations/supabase/client.ts`

## Chamado por
- App.tsx (Rotas)
- Layout.tsx (Header e Navbar)

## Riscos / Observações
- **Risco:** Usuários com a senha antiga perderão acesso temporariamente.
- **Mitigação:** Criação das contas no dashboard do Supabase do projeto, informando os usuários.
- O arquivo obsoleto `src/lib/auth.ts` foi completamente removido para assegurar o princípio de **Zero Trust**.

## Histórico de Alterações
- Data: 2024 (Sessão Atual)
- Alteração: Criação da página `Login.tsx`, refatoração do `AuthContext.tsx` e deleção de `auth.ts`.
- Motivo: Atender os requisitos de segurança da arquitetura Multi-Tenant.