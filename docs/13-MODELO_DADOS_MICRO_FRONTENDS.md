# Módulo de Banco de Dados / System Modules (Micro-Frontends)

## Descrição
Alteração na estrutura da tabela `system_modules` para suportar a arquitetura de Micro-Frontends (Blocos de Lego). Permite que o Jota Master identifique se um módulo é interno (hardcoded) ou externo (carregado via URL/Iframe).

## Entradas
- Valores de configuração inseridos via Painel Admin (Tabela `system_modules`).
- `bundle_url`: URL da CDN onde o pacote do módulo está hospedado.
- `module_type`: Categoria de renderização do módulo (`internal` ou `iframe`).

## Saídas
- O Frontend consome essas colunas na rota `/modules` para decidir qual componente renderizador utilizar (`Componente Local` ou `<DynamicModuleLoader>`).

## Fluxo
1. Administrador cadastra um novo módulo no Supabase informando `bundle_url`.
2. Frontend (Rota Protegida) recupera os dados do módulo do banco.
3. Switch case no roteador do React avalia o `module_type`.
4. Se `iframe`, injeta a URL de forma isolada e segura.

## Dependências
- Tabela `system_modules` (Supabase).
- Painel de Administração (`AdminDashboard.tsx`) para gestão dos URLs.

## Chamado por
- Roteador dinâmico do Frontend (a ser implementado no Passo 3).

## Riscos / Observações
- **Segurança (AppSec):** A coluna `bundle_url` é um vetor crítico de XSS. Se comprometida, injeta código arbitrário na Placa-mãe.
- **Mitigação:** Row Level Security (RLS) estrito ativo. Apenas perfis com `role = 'admin'` possuem privilégios de escrita nesta tabela. O Frontend deve tratar qualquer URL de forma "Zero Trust".

## Histórico de Alterações
- Data: 2024 (Sessão Atual)
- Alteração: Adição das colunas `bundle_url` e `module_type`.
- Motivo: Viabilizar a injeção remota e segura de micro-frontends (SaaS modular).