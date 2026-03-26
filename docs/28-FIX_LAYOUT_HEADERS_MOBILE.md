# Correção de Design: Cabeçalhos de Ação Mobile

## Descrição
Refatoração dos cabeçalhos das páginas de gerenciamento (Prompts, Skills, Agentes) para eliminar sobreposição de elementos e cortes laterais em telas pequenas.

## Fluxo de Correção
1. **Hierarquia:** Título movido para bloco superior isolado no mobile.
2. **Grid de Ações:** Botões de ação (Importar, Exportar, Novo, Salvar) convertidos de `flex` para `grid grid-cols-2` em telas `< 768px`.
3. **Touch Targets:** Garantia de altura mínima de 40px para todos os botões de ação.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Substituição de `flex-wrap` por `grid` responsivo nos cabeçalhos.
- Motivo: Elementos saindo da tela lateralmente no mobile.