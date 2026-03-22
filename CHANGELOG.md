# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - Sessão Atual

### Corrigido (Distribuição Global de IA)
- **Arquivo(s):** Banco de Dados (Supabase), `docs/20-CORRECAO_RLS_IA_GLOBAL.md`
- **Descrição da alteração:** Atualização das políticas de Row Level Security (RLS).
- **Motivo da mudança:** Permitir que contas do tipo "empresa" leiam registros marcados como `is_global = true`. As políticas antigas de "Isolamento Total" bloqueavam o comando `SELECT`, invisibilizando a curadoria do admin para o usuário final.

### Modificado (Arquitetura de Desenvolvimento de Módulos)
- **Arquivo(s):** `docs/15-GUIA_DESENVOLVEDOR_MODULOS.md`
- **Descrição da alteração:** Inclusão das diretrizes para estruturação de "Teste Local" (Dev Harness) e injeção do "Manifesto de IA". Inclusão do Prompt de Governança Estrita (Ciclo de 8 passos).
- **Motivo da mudança:** Orientar os agentes e desenvolvedores sobre como criar e visualizar Micro-Frontends localmente sem duplicar a carga da IA, apenas exportando o `ai-manifest.json`.