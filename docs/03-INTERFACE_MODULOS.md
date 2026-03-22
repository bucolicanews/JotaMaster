# Segurança e Governança - Módulo: Central de Módulos (Marketplace)

## Descrição
Interface visual ("Placa-mãe") para gestão dos blocos de Lego (plugins/módulos) do sistema Jota Master. Permite visualizar os módulos disponíveis por locatário (Tenant).

## Entradas
- Interação do usuário (Cliques em botões de ação).
- Autenticação do usuário (Validação da sessão ativa).

## Saídas
- Renderização do status visual de cada módulo (Ativo / Em Breve).
- Alertas e notificações informativas na interface (Toast).

## Fluxo
1. Usuário acessa a rota `/modules`.
2. O sistema lista os módulos disponíveis (combinando dados estáticos e dinâmicos).
3. A interface bloqueia proativamente ações não autorizadas (módulos em desenvolvimento ou sem permissão).

## Dependências
- `src/components/ui/card`
- `src/components/ui/badge`
- `lucide-react`

## Chamado por
- `src/components/Layout.tsx` (Menu de Navegação Superior)
- `src/App.tsx` (Gestor de Rotas)

## Riscos / Observações
- **Risco:** Execução acidental de fluxos de módulos não prontos.
- **Mitigação:** Aplicação de `disabled` nos botões e validação condicional no `onClick` para evitar qualquer tipo de execução anômala (Fail Safe).

## Histórico de Alterações
- Data: 2024 (Sessão Atual)
- Alteração: Criação da página `Modules.tsx` e integração ao ecossistema.
- Motivo: Prover uma interface unificada para a arquitetura modular SaaS Multi-Tenant.