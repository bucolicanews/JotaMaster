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
- Não crie menus globais redundantes; o Master já gerencia a navegação.

### 2.4. Comunicação e Autenticação (PostMessage)
- O artefato **NÃO** tem acesso direto a cookies, `localStorage` ou tokens do Jota Master. O contexto (como `user_id`) é resolvido de forma isolada ou via passagem segura de mensagens (`window.postMessage`).

---

## 3. GOVERNANÇA E DOCUMENTAÇÃO (REGRA DE ARTEFATOS)

Todo desenvolvedor (humano ou IA) atuando neste ecossistema tem a responsabilidade obrigatória de **documentação, rastreabilidade e validação técnica**.

### 3.1. Documentação Contínua
Nenhuma alteração no sistema ocorre sem a geração/atualização de arquivos `.md`. Cada função implementada deve gerar um mapeamento contendo:
- Objetivo e Parâmetros.
- Funções dependentes e fluxos de execução passo a passo.
- Possíveis efeitos colaterais e tratamento de erros.

### 3.2. Análise Antes da Execução (Obrigatório para Agentes IA)
Antes de escrever código, o fluxo obrigatório é:
1. **Entender a solicitação** (Qual é o requisito?).
2. **Questionar e validar a proposta** (Faz sentido na arquitetura do Jota?).
3. **Analisar impactos e riscos** (Pode quebrar o RLS do Supabase? Pode gerar XSS?).
4. **Propor melhorias** (Há um jeito mais performático/seguro?).
5. **Aguardar confirmação lógica**.
6. **Executar alteração**.
7. **Documentar detalhadamente**.
8. **Atualizar repositório `.md`**.

### 3.3. Padrão de Documentação de Artefato (.MD)
Ao criar um novo módulo (ex: `modulo_controle_clientes`), você DEVE criar a documentação usando exatamente esta estrutura:

```md
# Nome do Módulo / Função

## Descrição
[O que faz e qual problema resolve]

## Entradas
[Inputs de usuário, chamadas de DB, parâmetros]

## Saídas
[O que renderiza, o que grava no banco]

## Fluxo
1. [Passo a passo lógico]
2. ...

## Dependências
- [Componentes, Tabelas do Supabase, Contextos]

## Chamado por
- [Onde este artefato é instanciado]

## Riscos / Observações
- [Tratamento de injeção, falhas de estado, RLS]

## Histórico de Alterações (Changelog)
- Data: [DD/MM/AAAA]
- Alteração: [O que foi feito]
- Motivo: [Por que foi feito]
- Impactos: [O que afetou]
```

### 3.4. Regra Crítica Final
**NUNCA:**
- Altere código sem análise prévia.
- Execute mudanças arquiteturais sem questionamento.
- Deixe de documentar qualquer modificação no CHANGELOG.md ou no `.md` do módulo.

**SEMPRE:**
- Priorize a consistência, rastreabilidade e clareza técnica.
- Mantenha o repositório (`/docs`) como a fonte única da verdade.