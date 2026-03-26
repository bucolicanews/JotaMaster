# Restauração de Inteligência e Ajuste de Sidebar

## Descrição
Este documento registra a restauração da lógica de atalhos (`@`, `#`, `/`) no chat e a correção de overflow nos itens da barra lateral de conversas.

## Funcionalidades Restauradas
1. **Atalhos de Menção:** Detecção em tempo real de gatilhos para Skills, Agentes e Prompts.
2. **Auto-complete:** Menu flutuante de sugestões integrado ao input de texto.

## Correções de Layout
1. **Sidebar Scaling:** Redução da largura da sidebar para `w-64` e ajuste de paddings internos.
2. **Text Truncation:** Garantia de que títulos longos de conversa não empurrem os botões de ação para fora do container.

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Restauração de lógica de menção e fix de largura de itens.
- Motivo: Regressão de funcionalidade detectada após limpeza de layout.