# Segurança - Painel de Controle Admin

## Tipo de Entrada
- Dados lidos da tabela `profiles` e `installed_modules`.
- Inputs de alteração de status e plano por parte do administrador.

## Validações Aplicadas
- **Frontend:** Proteção de rota via `<RotaProtegida>` e verificação do contexto `isAdmin`.
- **Backend (Supabase):** RLS (Row Level Security) exigindo que o `auth.uid()` tenha a coluna `role = 'admin'` para retornar a lista de todos os locatários.

## Sanitização
- Tratamento de nulos ao renderizar nomes de empresas e planos.
- Uso exclusivo dos métodos do Supabase SDK (que tratam SQL Injection internamente via rotinas parametrizadas).

## Riscos Identificados
- **Escalonamento de Privilégios:** Um usuário "empresa" interceptar a chamada e alterar seu próprio `role` para `admin`.

## Mitigações Implementadas
- Apenas a role `admin` possui permissão de `UPDATE` na tabela `profiles` para alterar a coluna `role`. A trigger de novo usuário (`handle_new_user`) força o cadastro inicial sempre como `empresa`.

## Logs Gerados
- Auditoria do Postgres (Supabase) rastreia alterações de nível de linha em profiles.