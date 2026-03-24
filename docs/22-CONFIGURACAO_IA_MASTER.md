# Configuração de Economia de IA (Master)

## Descrição
Este módulo permite ao Administrador configurar a infraestrutura de custos e lucros sobre o uso da API Vertex AI.

## Parâmetros de Lucratividade
1. **Master Key:** Chave de API do Google Cloud (Vertex) usada para todas as requisições dos clientes.
2. **Custo Base (1M Tokens):** Valores oficiais do Google Cloud em USD.
3. **Multiplicador de Lucro:** Fator aplicado sobre o custo real para gerar o débito no cliente.
   - *Exemplo:* Custo Google = R$ 0,01. Multiplicador = 5. Débito Cliente = 5 créditos (R$ 0,05).
4. **Taxa de Conversão:** Define o valor monetário do crédito interno.

## Segurança
A Master Key nunca é exposta ao frontend do usuário final. Ela reside no banco de dados e é consumida apenas por processos de backend (Edge Functions).