# Módulo de Curadoria de IA (Admin Dashboard)

## Descrição
Funcionalidade que permite aos Administradores do sistema visualizar, auditar, editar e promover (tornar global) Prompts, Skills e Agentes criados por locatários (usuários finais). Estabelece um fluxo de crowdsourcing seguro para o ecossistema de IA.

## Entradas
- Operação de leitura irrestrita (`SELECT *`) nas tabelas `ai_prompts`, `ai_skills` e `ai_agents` quando o usuário possui a role `admin`.
- Interação (Toggle Switch) na propriedade `is_global`.

## Saídas
- Requisição de Upsert (Atualização) no banco de dados preservando o `user_id` do autor original, mas modificando as regras de distribuição global.

## Fluxo
1. O administrador acessa a tela de Configurações (`/configuracao`).
2. O sistema identifica a Role `admin` e puxa todos os registros de IA do banco.
3. A UI exibe as inteligências de terceiros com a Badge "COMUNIDADE".
4. O administrador edita ou ativa a chave "Global".
5. O sistema envia o Upsert validado para o Supabase.
6. O RLS customizado permite a operação com base em `get_user_role() = 'admin'`.

## Dependências
- `src/pages/Configuracao.tsx`
- Função Supabase `get_user_role()`
- Políticas RLS Atualizadas.

## Chamado por
- Tela `/configuracao`

## Riscos / Observações
- **Escalonamento Acidental:** Se a validação de preservação de `user_id` falhar no frontend, a autoria dos prompts poderia ser roubada pelo admin. O código aplica `user_id: s.userId || uid` para mitigar isso.
- **Sobrecarga Visual:** Se houver milhares de prompts de usuários, a tela de configuração pode sofrer lentidão. *Planejamento futuro: Adicionar paginação.*

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Liberação de edição de IA de terceiros para admins e criação de RLS de Bypass.
- Motivo: Atender requisito de moderação e compartilhamento de inteligência por parte da administração.