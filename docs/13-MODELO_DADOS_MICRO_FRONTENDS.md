# Modelo de Dados / System Modules (Artefatos e Micro-Frontends)

## Descrição
Alteração estrutural e arquitetural na tabela `system_modules` para suportar a **Nova Arquitetura de Artefatos (Micro-Frontends)**. Este documento define como o Jota Master identifica, registra e isola módulos internos (hardcoded) e artefatos externos (carregados via URL/Iframe), mantendo a governança estrita e a rastreabilidade exigida pelo sistema.

## Entradas
- Valores de configuração inseridos via Painel Admin (Tabela `system_modules`).
- `bundle_url`: URL da CDN onde o pacote (Artefato) do módulo está hospedado.
- `module_type`: Categoria de renderização do módulo (`internal` ou `iframe`).

## Saídas
- O Frontend consome essas colunas na rota `/modules` para decidir qual componente renderizador utilizar (`Componente Local` ou `<DynamicModuleLoader>`).
- Logs de acesso e relatórios de auditoria baseados na origem do artefato.

## Fluxo
1. **Análise Inicial:** O Administrador cadastra um novo artefato informando `bundle_url`.
2. **Validação:** O sistema verifica as políticas de HTTPS e os cabeçalhos de segurança.
3. **Persistência:** Registro salvo na tabela `system_modules`.
4. **Consumo:** Frontend (Rota Protegida) recupera os dados do artefato validado.
5. **Decisão:** Switch case no roteador do React avalia o `module_type`.
6. **Injeção:** Se `iframe`, injeta a URL de forma isolada (Sandbox), impedindo contaminação do Master.

## Dependências
- Tabela `system_modules` (Supabase).
- Painel de Administração (`AdminDashboard.tsx`) para gestão e curadoria das URLs.

## Chamado por
- Roteador dinâmico do Frontend (`DynamicRouteHandler.tsx`).
- Loja de Módulos (`Modules.tsx`).

## Riscos / Observações
- **Segurança (AppSec):** A coluna `bundle_url` é um vetor crítico de XSS. Se comprometida, injeta código arbitrário na Placa-mãe.
- **Tratamento de Erros:** O sistema exige validação estrita (HTTPS) antes do salvamento.
- **Mitigação:** Row Level Security (RLS) estrito ativo. Apenas perfis com `role = 'admin'` possuem privilégios de escrita nesta tabela. O Frontend deve tratar qualquer URL de forma "Zero Trust".

## Histórico de Alterações
- Data: 2024 (Revisão Contínua)
- Alteração: Adição das colunas `bundle_url` e `module_type` e adequação à Arquitetura de Artefatos.
- Motivo: Viabilizar a injeção remota e segura de micro-frontends (SaaS modular) com rastreabilidade total.
- Impacto Esperado: Desacoplamento do desenvolvimento de módulos do repositório principal.