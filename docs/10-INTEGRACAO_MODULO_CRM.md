# Integração de Módulos Dinâmicos (Marketplace & CRM)

## Descrição
Este documento detalha a implementação da arquitetura de Marketplace SaaS do Jota Master e o acoplamento do primeiro módulo externo simulado (CRM - Controle de Clientes).

## Entradas
- Dados do Catálogo (`system_modules`).
- Solicitação de acesso a rotas protegidas por módulo (`/crm`).

## Saídas
- Interface de Loja atualizada no `Modules.tsx`.
- Painel de controle de preços e ativação no `AdminDashboard.tsx`.
- Renderização do módulo `/crm` condicionada à posse.

## Fluxo
1. Usuário tenta acessar `/crm`.
2. `ModuleProtectedRoute` intercepta a requisição.
3. Consulta ao Supabase RLS valida se `installed_modules` contém `module_id = 'crm'` para o `auth.uid()`.
4. Se verdadeiro, renderiza `CRM.tsx`. Se falso, redireciona para `/modules` com alerta de segurança.

## Dependências
- `ModuleProtectedRoute` (Camada de Segurança).
- `system_modules` (Tabela Supabase).

## Chamado por
- `App.tsx` (Roteamento).

## Riscos / Observações
- A segurança principal recai sobre o RLS no Supabase. O Frontend age como barreira de UX (Defense in Depth).

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Implementação do Catálogo Dinâmico e Módulo CRM.
- Motivo: Atender à demanda de escalabilidade do SaaS e monetização de módulos.