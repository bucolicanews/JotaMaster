# Log de Erros e Inconsistências (Bug Log)

## [BUG-001] Erro de Conflito de Ferramentas no Gemini
- **Data:** Sessão Atual
- **Arquivo:** `src/lib/geminiService.ts`
- **Descrição:** A API do Gemini retornou erro 400: `Built-in tools and Function Calling cannot be combined`.
- **Causa Raiz:** O modelo `gemini-2.0-flash` não permite o uso simultâneo da ferramenta nativa `google_search` (Grounding) e de `functionDeclarations` (Skills Customizadas) na mesma requisição.
- **Impacto:** Bloqueio total das respostas do chat quando ambas as funções estão ativadas.
- **Sugestão de Correção:** Implementar lógica de prioridade. Se houver Skills ativas ou chamadas, desativar temporariamente o Google Search para aquela requisição.

## [BUG-002] Aviso de Propriedade Não Reconhecida (viewportRef)
- **Data:** Sessão Atual
- **Arquivo:** `src/components/ui/scroll-area.tsx`
- **Descrição:** Aviso no console: `React does not recognize the viewportRef prop on a DOM element`.
- **Causa Raiz:** A propriedade `viewportRef` está sendo passada para um elemento `div` nativo através do espalhamento de props (`...props`), o que o React não permite para atributos customizados não prefixados.
- **Impacto:** Poluição do console de desenvolvimento e possível comportamento inesperado em refs.
- **Sugestão de Correção:** Desestruturar a prop `viewportRef` para que ela seja usada apenas onde necessário e não chegue ao elemento DOM final.