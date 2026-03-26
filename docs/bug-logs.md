## [BUG-005] RLS UPSERT Block para Admins e Quebra de Layout
- **Data:** Sessão Atual
- **Status:** Proposta de Correção enviada.
- **Descrição:** Admins sofriam bloqueio ao atualizar skills de usuários devido à validação de `INSERT` durante o `UPSERT`. O layout das opções de execução estava com paddings assimétricos.
- **Resolução Proposta:** Adição de exceção de admin no `WITH CHECK` das políticas de `INSERT` e remoção de backgrounds/paddings excessivos no grid de configuração da Skill.