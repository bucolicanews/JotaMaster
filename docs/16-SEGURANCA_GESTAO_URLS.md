# Segurança - Gestão de URLs de Módulos (Admin Dashboard)

## Descrição
Políticas de segurança aplicadas no Painel de Administração durante o cadastro de novos Micro-Frontends (URLs de CDNs externas).

## Tipo de Entrada
- Input de texto: `bundle_url` (Ex: `https://meu-modulo.com`).
- Input de seleção: `module_type` (`internal` | `iframe`).

## Validações Aplicadas (AppSec)
1. **Obrigatoriedade Condicional:** Se o tipo de módulo for `iframe`, a URL passa a ser estritamente obrigatória.
2. **Validação de Protocolo (HTTPS Enforcement):** A URL fornecida deve iniciar obrigatoriamente com `https://`. Tentativas de injeção de `javascript:`, `data:` ou `http:` são bloqueadas antes de atingirem a rede.
3. **Data Cleansing:** Se um módulo for alterado de `iframe` de volta para `internal`, a URL no banco de dados é automaticamente limpa (`null`) para evitar lixo ou execuções fantasmas caso o tipo mude no futuro.

## Riscos Identificados e Mitigados
- **Risco:** Stored XSS via `javascript:` URI.
- **Mitigação:** Bloqueio no Frontend e sanitização estrita. O backend (Supabase) também impede inserções sem token de Admin (via RLS).

## Histórico de Alterações
- Data: Sessão Atual
- Alteração: Inclusão de validação de HTTPS no `AdminDashboard.tsx`.