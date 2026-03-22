# Segurança - AdminDashboard (Tratamento de Relacionamentos)

## Tipo de Entrada
- Consultas ao Supabase: Tabelas `profiles` e `installed_modules`.

## Validações Aplicadas
- Separação estrita de consultas (Queries isoladas) para evitar erros do GraphQL/PostgREST (`Could not find a relationship`).

## Sanitização
- Associação manual dos módulos aos perfis na camada de memória do Frontend (Array Mapping).
- Tratamento explícito de arrays nulos `(data || [])`.

## Riscos Identificados
- **Risco de Crash da Aplicação:** O uso de Subqueries `.select('*, tabela_relacionada(*)')` depende da integridade total de Foreign Keys no esquema do banco. Se a FK não existir, a requisição quebra com status 400, derrubando o dashboard.

## Mitigações Implementadas
- **Defense in Depth:** Desacoplamento das consultas. Se a tabela de módulos falhar, a tabela de perfis ainda é renderizada com um log de aviso não destrutivo (`console.warn`), garantindo a continuidade da operação do administrador.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Refatoração da lógica de busca de clientes no `AdminDashboard.tsx`.
- Motivo: Resolução de erro em tela devido a falha de relacionamento entre tabelas do Supabase.