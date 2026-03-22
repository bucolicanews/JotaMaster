# INSTRUÇÕES PARA A IA - CRIAÇÃO DO MÓDULO CONTROLE DE CLIENTES (CRM)

**Atenção IA:** Você está atuando no repositório `modulo_controle_cliente`. 
Este projeto NÃO é uma aplicação isolada. Ele é um **Módulo (Plugin/Micro-frontend)** que será acoplado a uma plataforma maior chamada **Jota Master (Placa-mãe)**. 

Você deve atuar sob rígidos padrões de **Governança, Documentação (.md) e Segurança (AppSec)**.

---

## 1. OBJETIVO DO MÓDULO (MVP)
Criar um CRUD básico e funcional de Clientes (CRM) que possa ser ativado, desativado e renderizado dentro da plataforma principal.

**Funcionalidades Exigidas:**
- Listagem de Clientes (Tabela com busca e paginação).
- Cadastro de Cliente (Razão Social, CNPJ, Email, Telefone, Status).
- Edição e Exclusão de Cliente.
- Dashboard simplificado (Total de clientes, Clientes Ativos).

---

## 2. REGRAS DE ARQUITETURA E INTEGRAÇÃO (O CONTRATO)

Para garantir que este módulo "encaixe" no Jota Master, siga estas regras cegamente:

### 2.1. Autenticação e Banco de Dados (Supabase)
- O módulo **NÃO DEVE** ter tela de login ou registro. 
- O módulo deve assumir que a autenticação já foi feita. Toda ação no banco de dados deve utilizar o `user_id` da sessão atual do Supabase.
- **RLS (Row Level Security) é obrigatório.** O script de criação das tabelas DEVE garantir que um locatário (empresa) só veja seus próprios clientes.

### 2.2. Design System e UI
- Use **Tailwind CSS**.
- Use os componentes do **shadcn/ui** (já configurados no projeto).
- Ícones devem ser obrigatoriamente da biblioteca **lucide-react**.
- Não crie arquivos CSS personalizados. Use as variáveis CSS de cor já estabelecidas no padrão shadcn (ex: `bg-background`, `text-primary`, `bg-card`).

### 2.3. Exportação do Módulo
- O componente principal deve ser exportado de forma limpa, preferencialmente num arquivo `src/index.ts` ou preparado para ser consumido como um componente React que será injetado na rota `/crm` do Jota Master.

---

## 3. BANCO DE DADOS (SCRIPT SQL INICIAL)

A primeira coisa a fazer é criar a tabela no Supabase. O script SQL deve ser documentado e estruturado assim:

```sql
-- Tabela de Clientes do CRM
CREATE TABLE public.crm_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Vínculo com o locatário (Tenant)
    razao_social TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    telefone TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (OBRIGATÓRIO)
ALTER TABLE public.crm_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Isolamento de Tenant)
CREATE POLICY "Usuários veem apenas seus clientes" ON public.crm_clientes
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem apenas seus clientes" ON public.crm_clientes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam apenas seus clientes" ON public.crm_clientes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam apenas seus clientes" ON public.crm_clientes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

---

## 4. DIRETRIZES DE SEGURANÇA (APPSEC) E INPUT VALIDATION

Ao criar os formulários de cadastro e edição de clientes, você **DEVE**:
1. **Validar Entradas:** CNPJ deve ser formatado e ter limite de caracteres. Email deve passar por regex.
2. **Tratamento de Erros:** Use `try/catch` em todas as chamadas ao Supabase e exiba feedbacks claros usando a biblioteca `sonner` (`toast.error`, `toast.success`).
3. **Prevenção de Injeção:** Confie exclusivamente na API do Supabase (que parametriza as queries) para operações de banco.

---

## 5. DOCUMENTAÇÃO OBRIGATÓRIA

Para cada componente e função crítica criada, você deve gerar arquivos `.md` na pasta `docs/` explicando:
- O que o componente faz.
- Suas entradas e saídas (Props).
- Riscos e mitigações (Segurança).

---

## SEU PRIMEIRO PASSO COMO IA:
1. Leia estas instruções.
2. Crie a estrutura inicial de pastas (`src/components`, `src/pages/CRM`, `src/hooks`).
3. Crie o arquivo `docs/01-ARQUITETURA_CRM.md` registrando que compreendeu o modelo de Módulo Integrado.
4. Implemente a interface visual base do CRM (Dashboard e Tabela Vazia) pronta para receber os dados do Supabase.

Aguardando sua confirmação e início da codificação.