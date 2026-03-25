# Log de Erros e Inconsistências (Bug Log)

## [BUG-001] Erro de Conflito de Ferramentas no Gemini
- **Status:** Resolvido com Alternância Inteligente.
- **Descrição:** A API do Gemini não permite `google_search` e `functionDeclarations` juntos.
- **Resolução Final:** 
    - Se o usuário usa `@`, o sistema ativa apenas `functionDeclarations`.
    - Se o usuário não usa `@` e o Grounding está ON, o sistema ativa apenas `google_search`.
    - Isso garante que a Pesquisa na Internet funcione sempre que o usuário estiver em uma conversa convencional.

## [BUG-002] Aviso de Propriedade Não Reconhecida (viewportRef)
- **Status:** Resolvido.