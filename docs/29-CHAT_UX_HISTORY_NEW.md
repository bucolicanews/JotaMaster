# Evolução de UX: Histórico e Nova Conversa no Chat

## Descrição
Implementação de controles de navegação de chat para dispositivos móveis, resolvendo a invisibilidade da sidebar em telas pequenas.

## Funcionalidades Adicionadas
1. **Acesso Rápido:** Botão de "Nova Conversa" (+) adicionado ao cabeçalho global do chat.
2. **Mobile History:** Integração do componente `Sheet` (Drawer) para exibir o histórico de conversas em telas mobile via ícone de balão de mensagem.
3. **Persistência:** Mantida a lógica de `localStorage` para sessões, agora com pontos de entrada claros no mobile.

## Fluxo de Execução
1. Usuário clica no ícone de mensagem no mobile.
2. O sistema abre uma gaveta lateral com a lista de sessões.
3. Ao selecionar uma sessão, o estado `activeSessionId` é atualizado e a gaveta é fechada.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Adição de botões de controle no header e drawer de histórico.
- Motivo: Melhoria de usabilidade e conformidade com padrões de aplicativos de chat modernos.