# Manual Avançado de Construção de Skills (JOTA Master)

## 1. Introdução
As Skills são o "sistema nervoso" da IA. Elas permitem que o modelo de linguagem saia da teoria e execute ações práticas.

## 2. Tipos de Execução e Exemplos

### A) JavaScript Local (local_js) - Busca no Supabase
**Objetivo:** Consultar dados em tempo real no banco de dados.
```javascript
// Busca dados de um cliente pelo CNPJ
const { data, error } = await supabase
  .from('crm_clientes')
  .select('*')
  .eq('cnpj', args.cnpj)
  .single();

if (error) return { status: "erro", msg: "Cliente não localizado" };
return data;
```

### B) JavaScript Local (local_js) - Inserção no Supabase
**Objetivo:** Gravar logs ou registros operacionais.
```javascript
// Registra um novo atendimento
const { error } = await supabase
  .from('atendimentos')
  .insert([{ 
    user_id: args.user_id, 
    descricao: args.resumo,
    data: new Date().toISOString() 
  }]);

return error ? { status: "falha" } : { status: "sucesso" };
```

### C) Webhook (webhook) - Enviar JSON para n8n
**Objetivo:** Disparar fluxos complexos de automação (ex: gerar PDF, enviar WhatsApp).
**Configuração:** Basta colar a URL do Webhook do n8n. A IA enviará automaticamente o objeto `args` como corpo da requisição POST.

### D) Navegação Web (web_scraping) - Consultar Site
**Objetivo:** Extrair dados de sites que não possuem API oficial.
**Configuração:** 
- **URL:** `https://www.google.com/search?q=cotacao+dolar`
- **Seletor:** `.g .L69e7c` (Exemplo de classe CSS do elemento desejado).

### E) Base de Conhecimento (knowledge_base) - Consultar Texto
**Objetivo:** Fornecer manuais ou regras de negócio estáticas para a IA.
**Configuração:** Cole o texto bruto no campo de conteúdo. A IA usará esse texto como contexto prioritário.

## 3. Histórico de Alterações
- Data: Sessão Atual
- Alteração: Criação do manual detalhado de tipos de Skills.