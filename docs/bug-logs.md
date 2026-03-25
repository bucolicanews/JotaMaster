# Log de Erros e Inconsistências (Bug Log)

## [BUG-003] Skills Inacessíveis no Modo Automático
- **Data:** Sessão Atual
- **Status:** Proposta de Correção enviada.
- **Descrição:** As Skills habilitadas não eram consultadas pela IA a menos que o prefixo `@` fosse utilizado.
- **Causa:** Conflito de prioridade com a ferramenta de Grounding.
- **Correção Proposta:** Priorizar o envio de `functionDeclarations` (Skills) em todas as chamadas padrão, deixando o `google_search` apenas para casos de ausência de ferramentas ou solicitação explícita de busca web.