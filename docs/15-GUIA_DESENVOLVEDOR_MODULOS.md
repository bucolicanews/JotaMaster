# Guia de Desenvolvimento de Módulos (Arquitetura de Artefatos)

## 1. Visão Geral
Bem-vindo ao ecossistema **JOTA Master**. Este documento orienta desenvolvedores parceiros e Agentes de IA na criação de novos módulos (Artefatos/Blocos de Lego) que serão acoplados à nossa Placa-mãe. 

Nossa arquitetura baseia-se em **Micro-Frontends isolados (Iframes Sandboxed)** e um regime OBRIGATÓRIO de documentação e validação técnica.

---

## 2. Requisitos Técnicos e de Segurança (Obrigatório)

Para que seu módulo funcione dentro do Jota Master, ele deve respeitar as seguintes regras operacionais:

### 2.1. Protocolo e Hospedagem
- O módulo **DEVE** ser hospedado com certificado SSL/TLS válido (`https://`). O Master rejeitará conexões HTTP simples (Zero Trust).

### 2.2. Cabeçalhos de Segurança (CORS e Frame-Ancestors)
- Como o módulo rodará dentro de um Iframe, seu servidor/CDN deve permitir o encapsulamento: `Content-Security-Policy: frame-ancestors 'self' https://*.jotaempresas.com;`

### 2.3. Design e UX
- Garanta design responsivo (Mobile-First). Recomendamos o uso de **Tailwind CSS e shadcn/ui** para manter a consistência visual com a placa-mãe.
- Não crie menus globais redundantes; o Master já gerencia a navegação global.

### 2.4. Comunicação e Autenticação
- O artefato **NÃO** tem acesso direto a cookies ou tokens do Jota Master.
- Para acessar o banco de dados durante a execução em Iframe, o módulo deve validar a sessão ativa do Supabase gerada pelo navegador ou receber parâmetros seguros via URL/PostMessage.

---

## 3. ESTRUTURA MÍNIMA PARA TESTE LOCAL (DEV HARNESS)

Você **não** deve programar um módulo "às cegas". Todo novo módulo (ex: CRM) deve ser criado como um projeto React independente para facilitar a visualização e os testes locais antes do deploy.

### 3.1. O Boilerplate (Mock Master)
Seu projeto deve ter uma estrutura básica em React (Vite) para simular o Master:
1. **`src/App.tsx`:** Deve conter um roteador básico (`react-router-dom`) com um layout simples simulando o menu lateral da Placa-Mãe. Isso permite que você veja suas telas.
2. **`src/integrations/supabase/client.ts`:** Deve apontar para o MESMO banco de dados do Master para testar as leituras e inserções com RLS.
3. **Tela de Mock Login:** Como o módulo precisa de um `user_id` para gravar dados, crie um login falso ou use credenciais de teste locais no seu `.env` para simular uma sessão autenticada.

**Regra de Ouro:** Tudo que está no `App.tsx` do módulo serve **apenas para seu teste local**. Quando o módulo for para produção (build), o Master chamará as páginas diretamente via Iframe.

---

## 4. ECOSSISTEMA DE IA (COMO CRIAR SKILLS E AGENTES)

**MUITO IMPORTANTE:** O módulo **NÃO DEVE** criar telas de chat, nem importar SDK do Gemini, nem salvar prompts no banco de dados via código React. A Placa-Mãe (Jota Master) faz isso!

Para que o Master "aprenda" o que o seu módulo faz, você só precisa criar um arquivo na pasta pública do seu projeto:

### O Arquivo `public/ai-manifest.json`
Crie este arquivo com a estrutura abaixo. Quando o Master carregar a URL do seu módulo, ele fará o download deste JSON e gravará as Skills no banco de dados automaticamente.

```json
{
  "module_id": "meu_modulo_crm",
  "version": "1.0.0",
  "skills": [
    {
      "name": "crm_listar_clientes",
      "description": "Busca todos os clientes do usuário logado.",
      "executionType": "local_js",
      "suggestedInstruction": "Sempre que perguntarem sobre clientes, use esta skill.",
      "jsCode": "const { data } = await supabase.from('crm_clientes').select('*'); return data;"
    }
  ],
  "agents": [
    {
      "nome": "Assistente de Vendas",
      "systemPrompt": "Você é o assistente do CRM. Analise os clientes buscando oportunidades."
    }
  ],
  "prompts": [
    {
      "title": "Análise de Churn",
      "role": "Especialista em Retenção",
      "content": "Analise os dados e indique quais clientes podem cancelar."
    }
  ]
}
```
**Como testar a IA no seu módulo?** 
Você não testa. Você testa a tela e o CRUD localmente. Para testar a IA, você sobe o módulo para a CDN (ou usa Ngrok/Localhost), cadastra a URL no Jota Master (Painel Admin) e clica em **"Sincronizar Cérebro IA"**. O Master lerá seu `ai-manifest.json` e você testará no Chat da Placa-Mãe.

---

## 5. GOVERNANÇA E DOCUMENTAÇÃO (A REGRA DOS ARTEFATOS)

Todo desenvolvedor (humano ou IA) atuando neste ecossistema tem a responsabilidade obrigatória de **documentação, rastreabilidade e validação técnica**.

### 5.1. Análise Antes da Execução (O Fluxo de 8 Passos)
NUNCA escreva código sem antes:
1. **Entender a solicitação:** Qual é a dor de negócio?
2. **Questionar e validar a proposta:** Faz sentido nesta arquitetura?
3. **Analisar impactos e riscos:** Fere o RLS? Causa gargalo (N+1)?
4. **Propor melhorias:** Existe uma API mais adequada?
5. **Aguardar confirmação lógica.**
6. **Executar alteração.**
7. **Documentar detalhadamente.**
8. **Atualizar repositório `.md`.**

### 5.2. Padrão de Documentação de Módulos / Funções (.MD)
Na raiz de cada novo módulo (dentro da pasta `docs/`), documente cada feature usando estritamente:

```md
# Nome da Tela ou Função

## Descrição
[O que faz e qual problema resolve]

## Entradas
[Inputs de usuário, chamadas de DB, parâmetros de API]

## Saídas
[O que renderiza na UI, o que grava no banco]

## Fluxo de Execução
1. [Passo a passo lógico]
2. ...

## Dependências Internas e Externas
- [Tabelas do Supabase, Componentes, Funções que dependem desta]

## Riscos / Possíveis Efeitos Colaterais
- [Tratamento de injeção, falhas de estado, RLS, erros previstos]

## Histórico de Alterações (Changelog)
- Data: [DD/MM/AAAA]
- Alteração: [Arquivos modificados e descrição da mudança]
- Motivo: [Por que foi feito]
```

### 5.3. A Regra Crítica Final
**NUNCA:**
- Altere código sem análise prévia.
- Esconda erros ou ignore falhas de banco de dados (Fail Safe é lei).
- Deixe de registrar o *Changelog* e atualizar a documentação central.