# Correção de Políticas RLS para Distribuição Global de IA

## Descrição
Este documento registra a alteração nas políticas de Row Level Security (RLS) das tabelas do ecossistema de inteligência artificial (`ai_skills`, `ai_prompts`, `ai_agents`).

## Motivo da Alteração
A funcionalidade de curadoria do Admin (marcar `is_global = true`) estava gravando no banco corretamente, porém as políticas de Isolamento Total (`auth.uid() = user_id`) aplicadas no comando `SELECT` estavam bloqueando a leitura desses registros pelos locatários (usuários finais).

## Nova Política de Leitura (SELECT)
Foi criada uma política específica para `SELECT` que permite a visualização da linha se:
1. O usuário logado for o dono da linha (`auth.uid() = user_id`) **OU**
2. A inteligência estiver marcada como pública (`is_global = true`) **OU**
3. O usuário tiver privilégios de administração (`get_user_role() = 'admin'`).

## Riscos Mitigados
- **Escrita Indevida:** A política alterada afeta apenas o comando `SELECT`. Os comandos `UPDATE`, `INSERT` e `DELETE` continuam estritos (apenas Dono ou Admin podem alterar).

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Drop de políticas "Isolamento Total" e recriação segmentada de `SELECT`.