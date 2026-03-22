# Diretrizes de Segurança e Governança (Jota Master)

## 1. Princípios de Arquitetura e Governança
- Toda alteração deve ser rastreada e documentada.
- Padrão de Design: Material Design + Tailwind CSS (Mobile-First).
- Arquitetura: Monolito Modular (Placa-mãe + Blocos de Lego).

## 2. Princípios de Segurança (AppSec)
- **Zero Trust:** Nunca confiar em input do usuário ou do frontend.
- **Validação:** Tipagem estrita, limites e sanitização obrigatórios.
- **Banco de Dados:** Uso de queries parametrizadas (Supabase SDK) e Row Level Security (RLS) obrigatório em todas as tabelas.
- **Fail Safe:** Em caso de erro, a operação deve ser negada e logada sem expor a stack técnica.

## 3. Padrão de Log e Registro
Todo novo módulo ou função crítica deve ser registrado no `CHANGELOG.md` e possuir sua própria documentação detalhando Entradas, Saídas, Fluxos e Riscos.