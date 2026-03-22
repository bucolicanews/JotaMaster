# Segurança - Marketplace e Module Protection

## Tipo de Entrada
1. **Admin Input:** Alteração de preço de módulos no `AdminDashboard`.
2. **User Request:** Acesso direto a URLs de módulos (ex: `/crm`).

## Validações Aplicadas
- **Type Casting rigoroso:** Entradas de preço no Admin são convertidas e validadas `Number(val) >= 0`. Rejeita NaN.
- **Enforcement Point:** Criação do componente `ModuleProtectedRoute` que age como um "Guarda de Trânsito" em rotas premium.

## Sanitização
- Conversão de string para `float` fixado em 2 casas decimais antes do envio ao Supabase.

## Riscos Identificados
- **Bypass de Frontend:** Usuário modificar o state local do React para simular posse do módulo.
- **Injeção de Preço Negativo:** Admin digitar acidentalmente um valor negativo, gerando estorno no faturamento.

## Mitigações Implementadas
- **Zero Trust:** O `ModuleProtectedRoute` ignora estados locais e faz uma requisição em tempo real ao Supabase (`.single()`) valendo-se do RLS autenticado.
- **Limites de Input:** Input type="number" com `min="0"` e validação JS `Math.max(0, preco)`.

## Testes Realizados
- Tentativa de acesso à rota `/crm` sem posse (Redireciona para `/modules` com erro 403-like).

## Logs Gerados
- Em caso de acesso não autorizado, a aplicação dispara um `toast.error` (Auditoria no Frontend) alertando "Acesso Negado".