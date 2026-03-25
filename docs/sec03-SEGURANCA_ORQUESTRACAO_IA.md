# Segurança - Orquestração de Ferramentas (Gemini)

## Tipo de Entrada
- Payload JSON processado e enviado para a Google Vertex AI.
- `userContent` originado do frontend (input do usuário).

## Validações Aplicadas
- **Isolamento de Ferramentas:** O código garante matematicamente que o array `tools` nunca possua chaves conflitantes, tratando a limitação do provedor externo de forma resiliente.
- **Validação de Skills Autorizadas:** As skills passadas para o orquestrador são previamente filtradas na query do Supabase, garantindo que o usuário só consiga executar scripts JS atrelados ao seu próprio `user_id` ou marcados como `is_global`.

## Sanitização
- Os parâmetros `args` retornados pela IA (que serão passados para a função `executeSkill`) são executados dentro de um escopo assíncrono controlado (`new AsyncFunction`), limitando o acesso ao DOM ou variáveis globais sensíveis do cliente, expondo apenas o objeto `supabase` e `helpers` seguros.

## Riscos Identificados
- **Command Injection via JS Code:** Se um usuário mal-intencionado conseguir injetar código malicioso na coluna `js_code` da tabela `ai_skills`, ele poderia executar operações não autorizadas no banco de dados.

## Mitigações Implementadas
- **Defense in Depth (RLS):** A tabela `ai_skills` possui políticas estritas (Row Level Security). O usuário logado só pode inserir ou editar skills vinculadas ao seu próprio Tenant.
- **Isolamento de Token:** O objeto `supabase` injetado na Skill utiliza a sessão atual do usuário, o que significa que o RLS protegerá os dados mesmo que o JS gerado seja malicioso (o script não consegue bypassar as políticas de linha do Postgres).

## Testes Realizados
- Tentativa de enviar payload combinado (`google_search` + `functionDeclarations`).
- *Resultado:* Bloqueado no backend via lógica condicional (Exclusividade Estrita).

## Logs Gerados
- Erros de execução de Skills (`executeSkill`) são capturados no bloco `catch` e retornados com um objeto `{ error: msg }` para que a IA informe o usuário amigavelmente, sem causar o crash da aplicação (Fail Safe).