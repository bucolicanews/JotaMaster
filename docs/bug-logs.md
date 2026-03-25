# Log de Erros e Inconsistências (Bug Log)

## [ARQ-001] Refatoração da Gestão de Chaves de API (BYOK)
- **Data:** Sessão Atual
- **Status:** Em implementação.
- **Descrição:** A chave da API do Gemini estava sendo salva primariamente no `localStorage` através da tela de Configurações, causando falhas eventuais no Motor Autônomo quando a sincronização com o banco falhava.
- **Solução:** Criação de uma página dedicada de "Perfil do Usuário". A `api_key` agora é gerenciada exclusivamente através da tabela `profiles`, garantindo que a Edge Function (Motor Autônomo) sempre encontre a chave atualizada do usuário, independentemente de qual dispositivo ele esteja usando.