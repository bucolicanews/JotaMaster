# Correção de Layout Crítico e Viewport

## Descrição
Resolução de problemas de clipping (corte de conteúdo) e sobreposição de elementos em dispositivos móveis e desktop.

## Fluxo de Execução
1. **Layout:** Ajuste do container `main` para `display: flex` e `flex-direction: column`.
2. **Chat:** O container principal do chat agora usa `h-full` permitindo que o Flexbox gerencie o espaço.
3. **Sidebar Footer:** Alteração do container `NavigationContent` para `flex-1` em vez de `h-full`, garantindo que o rodapé do menu lateral não seja empurrado para fora da tela pelo cabeçalho do menu.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Fix do rodapé do menu lateral (perfil/logout).
- Motivo: Conteúdo do rodapé inacessível devido a estouro de altura no container pai.