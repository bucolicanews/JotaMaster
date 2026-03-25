# Correção de Viewport e Rolagem Mobile

## Descrição
Ajuste na arquitetura de containers para permitir rolagem vertical em páginas de conteúdo e garantir a visibilidade de elementos críticos (input de chat e títulos) em telas pequenas.

## Fluxo de Correção
1. **Global Layout:** Liberação do `overflow-y-auto` no container `main`.
2. **Home Page:** Substituição de centralização vertical forçada por padding superior responsivo.
3. **Chat Component:** Recálculo de altura responsiva para evitar clipping do input bar.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Remoção de `overflow-hidden` restritivo e ajuste de `min-h`.
- Motivo: Elementos de UI (input e títulos) inacessíveis no mobile.