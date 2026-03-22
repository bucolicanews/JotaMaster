# Arquitetura de Micro-Frontends (Injeção Dinâmica de Módulos)

## 1. Visão Geral (O Paradigma Master vs. Lego)
Este documento define o padrão arquitetural para o desacoplamento de módulos no ecossistema JOTA. O objetivo é permitir que o **Jota Master** (Placa-mãe) carregue funcionalidades desenvolvidas em repositórios Git independentes (Blocos de Lego) em tempo de execução, criando um verdadeiro *Marketplace SaaS*.

## 2. O Problema da Injeção Direta via Git (AppSec)
**Vulnerabilidade:** Navegadores não executam código TypeScript/React bruto. Além disso, compilar ou importar código de um repositório Git de terceiros dinamicamente abre o Master para *Supply Chain Attacks* e injeções de código malicioso (XSS).
**Princípio Violado:** Zero Trust.

## 3. A Solução Segura: Bundles em CDN e Sandboxing
Em vez de ler código fonte bruto, a arquitetura exige que cada módulo seja compilado (build) e hospedado como um pacote JavaScript estático (Bundle) em uma CDN segura ou empacotado para rodar em um Iframe isolado.

### Fluxo de Implantação (Deploy Flow)
1. **Desenvolvimento Isolado:** O desenvolvedor cria o módulo em um repositório Git separado (ex: `modulo_crm`).
2. **CI/CD (Build):** Ao aprovar a versão, uma pipeline compila o código em um *Bundle* minificado (HTML/JS/CSS).
3. **Hospedagem (CDN):** O Bundle é enviado para uma URL estática e segura (ex: `https://cdn.jota.com/modulos/crm/v1/remoteEntry.js`).
4. **Registro no Master:** O administrador cadastra essa URL na tabela `system_modules` no Supabase.

### Fluxo de Consumo (Runtime Flow)
1. O locatário (Tenant) "compra/instala" o módulo no Marketplace do Jota Master.
2. Ao acessar a rota do módulo (ex: `/crm`), o Master consulta o Supabase e recupera a `bundle_url`.
3. O Master utiliza um `<DynamicModuleLoader />` para baixar o código da CDN e injetá-lo na tela, ou renderiza um `<iframe>` com atributos de segurança (`sandbox="allow-scripts allow-same-origin"`).
4. **Comunicação:** O Módulo e o Master se comunicam exclusivamente via mensageria segura (`window.postMessage`) ou Contextos Compartilhados rigorosamente tipados, garantindo que o módulo nunca acesse o token de autenticação diretamente, mas solicite os dados ao Master.

## 4. Alterações Necessárias no Banco de Dados
Para suportar este modelo, a tabela do catálogo do Marketplace precisa armazenar a origem do módulo dinâmico.

**Proposta de Migração SQL:**
```sql
ALTER TABLE public.system_modules 
ADD COLUMN bundle_url TEXT,
ADD COLUMN module_type TEXT DEFAULT 'internal'; -- 'internal', 'federated', ou 'iframe'
```

## 5. Matriz de Risco e Mitigação (AppSec)

| Risco Identificado | Vetor de Ataque | Mitigação (Fail Safe) |
| :--- | :--- | :--- |
| **XSS via Módulo Comprometido** | Módulo de terceiro executando scripts maliciosos no Master. | Execução em Iframes com a flag `sandbox` estrita ou isolamento de escopo via Shadow DOM. |
| **Roubo de Sessão (Supabase Auth)** | Módulo tentando ler `localStorage` ou tokens JWT da Placa-mãe. | Bloqueio de acesso a recursos globais. O módulo deve pedir ao Master (via API/postMessage) para realizar requisições autenticadas. |
| **Módulo Offline / Erro 404** | A URL da CDN do módulo cai ou retorna erro, quebrando o Master. | `<ErrorBoundary>` e Fallback de UI ("Módulo temporariamente indisponível") no `DynamicModuleLoader`. |

## 6. Conclusão
Esta arquitetura garante que a plataforma seja infinitamente escalável, permitindo integrações com repositórios Git de parceiros ou times terceirizados, mantendo o núcleo do Jota Master 100% blindado contra códigos não confiáveis.