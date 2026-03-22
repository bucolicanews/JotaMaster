# Arquitetura de IA Distribuída (Multi-Agent Orchestration)

## 1. Visão Geral (O Paradigma Mestre-Aprendiz)
O Jota Master atua como um **Orquestrador Central**. Ele possui uma interface de Chat Inteligente e Agentes Autônomos, porém, ele "nasce" sem conhecimento específico das regras de negócio de setores isolados (como CRM, Financeiro ou Contábil).

A inteligência é **Distribuída e Injetada**. Quando um Locatário (Tenant) instala um Módulo (ex: CRM), esse módulo fornece ao Jota Master um "Manifesto de Inteligência" (`ai-manifest.json`).

## 2. O Manifesto de Inteligência (AI Manifest)
Cada Micro-Frontend (Módulo) deve hospedar na raiz do seu projeto um arquivo `ai-manifest.json`. Este arquivo contém as ferramentas (Skills), Agentes e Prompts que o módulo sabe fazer.

**Exemplo de Manifesto (CRM):**
```json
{
  "module_id": "crm",
  "version": "1.0.0",
  "skills": [
    {
      "name": "crm_buscar_clientes_inativos",
      "description": "Busca todos os clientes com status inativo.",
      "executionType": "local_js",
      "jsCode": "const { data } = await supabase.from('crm_clientes').select('*').eq('status', 'inativo'); return data;"
    }
  ],
  "agents": [
    {
      "nome": "Auditor de Churn (CRM)",
      "systemPrompt": "Você analisa evasão de clientes cruzando a data de inatividade."
    }
  ]
}
```

## 3. O Motor de Absorção (AI Ecosystem)
Ao clicar em "Sincronizar Inteligência" na Central de Módulos, o Jota Master:
1. Faz o download do `ai-manifest.json` da URL do módulo.
2. Varre as Skills e Agentes.
3. Insere os registros no banco de dados (Tabelas `ai_skills`, `ai_agents`), atrelando-os ao `user_id` do cliente logado e marcando a origem com o `module_id`.

## 4. A Orquestração (O Maestro)
Quando o usuário vai ao Chat Inteligente e pergunta: *"Quantos clientes inativos temos e qual o impacto financeiro?"*
O Agente Central do Master:
1. Lê o catálogo de Skills ativas no banco.
2. Percebe que tem uma Skill `crm_buscar_clientes_inativos` (ensinada pelo módulo CRM) e uma skill `fin_calcular_impacto` (ensinada pelo módulo Financeiro).
3. Executa as duas funções em cadeia e entrega a resposta unificada.

## 5. Segurança (AppSec)
- As Skills injetadas são executadas no contexto do Jota Master, mas herdam as regras de RLS do Supabase do usuário logado.
- Um módulo não pode sobrescrever as skills fundamentais do sistema, pois todas as skills de módulos são isoladas pelo `module_id`. Em caso de desinstalação do módulo, as skills são deletadas em cascata (Cascade Delete Lógico).