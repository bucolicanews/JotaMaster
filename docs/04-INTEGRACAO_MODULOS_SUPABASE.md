# Consulta de Módulos (Supabase)

## Descrição
Integração da interface `Modules.tsx` com a tabela `installed_modules` do Supabase para refletir dinamicamente o provisionamento de recursos de cada Tenant, utilizando políticas estritas de segurança de linha (RLS).

## Entradas
- Conexão autenticada `user_id` proveniente da SDK do Supabase.

## Saídas
- Lista de `module_id` ativos, armazenada no estado `installedModuleIds`.

## Fluxo
1. Carregamento inicial do componente `Modules`.
2. Execução assíncrona do hook `useEffect`.
3. Chamada `supabase.auth.getUser()` para validar sessão ativa.
4. Se falhar (ausência de auth real), aciona **Fail Safe** mantendo o mock local de permissões de módulos.
5. Se sucesso, consulta os módulos ativos via `supabase.from('installed_modules').select(...)`.
6. Renderização condicional visual (Ativo vs Bloqueado) na interface.

## Dependências
- `src/integrations/supabase/client.ts`
- `src/contexts/AuthContext.tsx` (Autenticação Local)

## Chamado por
- Página `/modules`

## Riscos / Observações
- **Conflito de Arquitetura:** Atualmente, a aplicação utiliza uma autenticação local (Fake Auth com senha hardcoded no `auth.ts`). Como o Supabase depende do token de sessão para aplicar o RLS na consulta ao banco de dados, o `user` retorna `null`. O sistema foi desenvolvido para lidar com este cenário de forma segura sem crashar a aplicação (`console.info`).
- **Resolução Exigida:** Para que o SaaS leia as permissões do banco, a Autenticação Local DEVE ser substituída pela Autenticação do Supabase.

## Histórico de Alterações
- Data: 2024 (Sessão Atual)
- Alteração: Adição de queries ao banco de dados em `Modules.tsx`.
- Motivo: Progresso no modelo Multi-Tenant.