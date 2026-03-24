# Segurança - Créditos e Pagamentos

## Tipo de Entrada
- Parâmetros de débito (user_id, amount).
- Payloads de Webhook (PagBank).

## Validações Aplicadas
- **Atomicidade:** Uso de `FOR UPDATE` no PostgreSQL para travar a linha do saldo durante o cálculo, impedindo que o usuário gaste o mesmo crédito em duas abas simultâneas.
- **Constraint de Integridade:** A coluna `balance` possui um `CHECK (balance >= 0)` no nível do banco de dados como última linha de defesa.

## Riscos Identificados
- **Race Conditions:** Múltiplas requisições rápidas tentando burlar o saldo.
- **Mitigação:** A lógica de decisão de saldo foi movida do Frontend para uma Função de Banco de Dados (RPC) protegida.

## Logs Gerados
- Toda alteração de saldo gera obrigatoriamente uma linha na tabela `credit_transactions` para auditoria forense.