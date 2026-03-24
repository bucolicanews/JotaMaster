# Guia do Desenvolvedor: Criação e Conexão de Módulos

Este guia detalha como construir um módulo (Micro-frontend) que se acopla perfeitamente à Placa-mãe JOTA, injetando automaticamente suas funcionalidades e inteligência artificial.

---

## 1. Arquitetura do Módulo
Um módulo JOTA é uma aplicação independente (Vite + React) hospedada externamente. Ele se comunica com o Master através de um **Manifesto de Inteligência**.

### Requisitos:
- Hospedagem em HTTPS (Segurança Zero Trust).
- Cabeçalhos CORS permitindo o domínio `jotaempresas.com`.
- Arquivo `ai-manifest.json` na raiz pública do projeto.

---

## 2. O Cérebro do Módulo: `ai-manifest.json`
Este arquivo é lido pelo Master no momento da instalação. Ele define quais Skills, Prompts e Agentes o módulo "ensinará" ao sistema.

### Estrutura Completa:
```json
{
  "module_id": "meu_modulo_financeiro",
  "version": "1.0.0",
  "dependencies": ["skills", "crm"], 
  "skills": [
    {
      "name": "fin_calcular_roi",
      "description": "Calcula o ROI baseado em investimento e retorno.",
      "executionType": "local_js",
      "jsCode": "return { roi: ((args.ganho - args.custo) / args.custo) * 100 };",
      "parameters": {
        "type": "object",
        "properties": {
          "custo": { "type": "number" },
          "ganho": { "type": "number" }
        }
      }
    }
  ],
  "prompts": [
    {
      "title": "Analista de Investimentos",
      "role": "CFO Virtual",
      "content": "Você é um CFO. Use a skill #fin_calcular_roi para analisar os dados de @empresa.razaoSocial."
    }
  ],
  "agents": [
    {
      "nome": "Auditor de Lucratividade",
      "systemPrompt": "Você orquestra a análise financeira completa.",
      "order": 1
    }
  ]
}
```

---

## 3. Gestão de Dependências
Se o seu módulo precisa de outro para funcionar (ex: um módulo de Relatórios que precisa do módulo de Skills), declare no campo `"dependencies"`.

**Comportamento do Master:**
- Se o usuário tentar instalar seu módulo sem as dependências, o Master exibirá um alerta: 
  > "Este módulo requer a instalação prévia do módulo: [Nome do Módulo X]."

---

## 4. Fluxo de Integração (Passo a Passo)

### Passo 1: Desenvolvimento
Crie seu app. Para acessar o banco de dados do cliente, utilize o `user_id` que o Master injetará via URL ou utilize a sessão ativa do Supabase (o Master e os Módulos compartilham o mesmo domínio de autenticação).

### Passo 2: Publicação do Manifesto
Certifique-se de que `https://seu-modulo.com/ai-manifest.json` está acessível.

### Passo 3: Cadastro no Master (Admin)
1. Vá em **Painel Admin > Catálogo SaaS**.
2. Clique em **Novo Módulo**.
3. Defina o tipo como **iframe**.
4. Cole a URL base do seu módulo.

### Passo 4: Sincronização
O usuário, ao clicar em **"Sincronizar Cérebro IA"** na Loja de Módulos, fará com que o Master:
1. Baixe o seu manifesto.
2. Grave as Skills, Prompts e Agentes no banco de dados dele, vinculando-os ao seu `module_id`.
3. Habilite imediatamente o uso dessas ferramentas no Chat Inteligente.

---

## 5. Segurança e Isolamento
- **Sandbox:** O Master carrega o módulo em um Iframe com políticas estritas (`allow-scripts`, `allow-forms`).
- **RLS:** Suas Skills executadas via `local_js` herdam as permissões do usuário logado no Supabase.
- **Limpeza:** Se o usuário desinstalar seu módulo, o Master remove automaticamente toda a inteligência (Skills/Prompts) vinculada ao seu `module_id`.

---

## 6. Histórico de Alterações
- **Data:** Sessão Atual
- **Alteração:** Criação do manual de integração de Micro-frontends e IA.
- **Motivo:** Padronizar a expansão do ecossistema JOTA.