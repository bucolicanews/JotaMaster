# Motor de Orquestração de Ferramentas (Gemini API)

## Descrição
Módulo responsável por decidir e encapsular quais ferramentas (Tools) serão enviadas na requisição para o Google Gemini. Foi implementado um padrão de "Alternância Inteligente" (Smart Switching) devido a uma limitação arquitetural da API do Gemini, que rejeita (HTTP 400) requisições que combinam `functionDeclarations` (Skills) e `google_search` (Grounding) no mesmo payload.

## Entradas
- `userContent` (String): A última mensagem digitada pelo usuário no chat.
- `skillsOverride` (Array): Lista de habilidades (DynamicSkills) cadastradas e ativas para o usuário atual.
- `useGrounding` (Boolean): Estado do switch (toggle) na interface do chat.

## Saídas
- `toolsArray` (Array): Array formatado e sanitizado contendo APENAS UM tipo de ferramenta para ser enviado na chave `tools` do payload da Vertex AI.

## Fluxo
1. O sistema recebe o `userContent` e verifica se contém o caractere de gatilho explícito (`@`).
2. Verifica se o `useGrounding` está ativo na UI.
3. Se o usuário digitou `@` -> Força a inserção exclusiva de `functionDeclarations` no `toolsArray`.
4. Se NÃO houver `@` E o `useGrounding` estiver `true` -> Insere exclusivamente o `google_search` no `toolsArray`.
5. Se o `useGrounding` estiver `false` -> Faz o fallback e insere as `functionDeclarations` (caso existam).
6. O payload final é enviado à API. Se a IA solicitar uma execução de função, o backend resolve a função, injeta o resultado e faz uma chamada recursiva mantendo a mesma matriz de ferramentas.

## Dependências
- `src/lib/geminiService.ts`
- `src/lib/skills/taxSkills.ts` (Motor de execução das funções)

## Chamado por
- `ChatInterface.tsx` (Componente de UI)

## Riscos / Observações
- **Risco de Falso Positivo:** Se o usuário digitar um e-mail (ex: `contato@teste.com`), a detecção atual baseada no `@` pode forçar o uso de Skills e desativar o Grounding acidentalmente. 
- *Ação de melhoria futura:* Refinar a regex de detecção para exigir que o `@` seja seguido por um nome válido de Skill.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Implementação de Exclusividade Estrita entre Skills e Grounding.
- Motivo: Evitar o erro `400 Bad Request: Built-in tools and Function Calling cannot be combined` e permitir que a IA responda sobre dados em tempo real.