# Correção: Layout Imersivo e Atalhos de IA

## Descrição
Resolução de uma regressão onde a implementação da lógica de atalhos acidentalmente reverteu o layout do chat para uma versão "encaixotada" e não responsiva.

## Fluxo de Correção
1. **Layout:** Restauração do wrapper principal para `div` com `h-full w-full`, eliminando o componente `Card` e suas restrições de altura/bordas.
2. **Lógica:** Manutenção do `handleInputChange` com detecção de posição de cursor para ativar o menu flutuante de Skills (`@`), Agentes (`#`) e Prompts (`/`).

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Merge do layout Fullscreen (Imersivo) com a lógica de Stacking Context dos atalhos.
- Motivo: O chat estava com layout quebrado/restrito e atalhos inoperantes.