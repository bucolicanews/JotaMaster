# Correção de Layout Crítico e Viewport

## Descrição
Resolução de problemas de clipping (corte de conteúdo) e sobreposição de elementos em dispositivos móveis. A principal mudança foi a substituição de alturas fixas (`h-[...]`) por estruturas flexíveis que respeitam os limites do contêiner pai.

## Entradas
- Viewport do navegador (Mobile/Desktop).

## Saídas
- Chat com campo de texto sempre visível no rodapé.
- Cabeçalhos de página com botões empilhados corretamente.

## Fluxo de Execução
1. **Layout:** Ajuste do container `main` para `display: flex` e `flex-direction: column`.
2. **Chat:** O container principal do chat agora usa `h-full` em vez de cálculos de `vh`, permitindo que o Flexbox do Layout gerencie o espaço.
3. **Headers:** Implementação de `grid-cols-1` no mobile para separar o título das ações.

## Riscos / Observações
- **Risco:** Em telas muito pequenas (iPhone SE), o cabeçalho do chat pode ocupar muito espaço.
- **Mitigação:** Redução de paddings e tamanhos de fonte via classes `sm:` e `md:`.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Fix de visibilidade do input de chat e overflow de botões.
- Motivo: Erro de usabilidade reportado pelo usuário (telas montadas).