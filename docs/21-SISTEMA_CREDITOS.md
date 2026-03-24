# Sistema de Créditos e Monetização

## Descrição
Motor responsável por gerenciar a economia interna do JOTA Master. Permite a compra de créditos via PagBank e o consumo controlado por requisições de IA.

## Entradas
- **Compra:** Webhook do PagBank confirmando pagamento.
- **Consumo:** Solicitação de chat ou execução de agentes.

## Saídas
- **Saldo:** Atualização em tempo real na tabela `wallets`.
- **Auditoria:** Registro de logs na tabela `credit_transactions`.

## Fluxo de Execução
1. Usuário solicita ação de IA.
2. Sistema chama a função RPC `debit_credits`.
3. Se retornar `true`, a chamada à API da Vertex AI é liberada.
4. Se retornar `false`, o usuário é bloqueado e convidado a recarregar.

## Dependências
- Supabase RPC (`debit_credits`)
- PagBank API (Edge Functions)

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Implementação inicial da arquitetura de créditos.