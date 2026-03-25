# Segurança - Gestão Dual de Chaves de IA

## Descrição
Implementação de um modelo híbrido onde o Administrador pode definir chaves de API globais (Vertex e Gemini) para assumir os custos e faturar via "Créditos", ao mesmo tempo em que mantém a possibilidade do usuário final fornecer sua própria chave (BYOK) no Perfil.

## Entradas
- `system_settings`: Tabela do Supabase onde as chaves globais serão armazenadas (acessível apenas por Admins).
- Formulário de `Configuracao.tsx`.

## Validações Aplicadas
- As chaves de API são mascaradas (`type="password"`) na interface do usuário para evitar vazamento local (over-the-shoulder attack).

## Riscos Identificados
- **Vazamento via API:** Se a tabela `system_settings` for consultada pelo frontend de um usuário comum (para pegar a taxa de conversão, por exemplo), a chave Vertex pode ser interceptada via Network Tab.

## Mitigações Implementadas
- **Isolamento de Backend:** O frontend do usuário final *nunca* precisa ler a chave de API global. As chamadas de IA do usuário comum enviam apenas a mensagem, e a **Edge Function** do Supabase é quem lê a tabela `system_settings` para pegar a Master Key e fazer a requisição ao Google.
- **Row Level Security:** Se o usuário tentar fazer um `SELECT vertex_api_key FROM system_settings`, a política restritiva deve retornar NULL.