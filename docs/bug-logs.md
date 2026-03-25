# Log de Erros e Inconsistências (Bug Log)

## [BUG-001] Erro de Conflito de Ferramentas no Gemini
- **Status:** Resolvido.

## [BUG-002] Aviso de Propriedade Não Reconhecida (viewportRef)
- **Status:** Resolvido.

## [BUG-003] Skills Inacessíveis no Modo Automático
- **Data:** Sessão Atual
- **Status:** Resolvido.
- **Descrição:** A IA não consultava as Skills a menos que o prefixo `@` fosse usado.
- **Resolução Final:** Implementada lógica de **Prioridade de Negócio**. O sistema agora envia `functionDeclarations` (Skills) por padrão em todas as chamadas. O `google_search` (Grounding) é ativado apenas se o usuário solicitar explicitamente uma pesquisa web ou se não houver Skills disponíveis (garantindo funcionalidade no Modo Grátis).