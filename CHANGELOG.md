# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Corrigido (Distribuição Global de IA)
- **Arquivo(s):** Banco de Dados (Supabase), `docs/20-CORRECAO_RLS_IA_GLOBAL.md`
- **Descrição da alteração:** Atualização das políticas de Row Level Security (RLS).
- **Motivo da mudança:** Permitir que contas do tipo "empresa" leiam registros marcados como `is_global = true`. As políticas antigas de "Isolamento Total" bloqueavam o comando `SELECT`, invisibilizando a curadoria do admin para o usuário final.