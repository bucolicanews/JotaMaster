# Log de Erros e Inconsistências (Bug Log)

## [BUG-004] Omissão de Campos de Configuração de Skills
- **Data:** Sessão Atual
- **Status:** Proposta de Correção enviada.
- **Descrição:** Após refatoração de layout mobile, os blocos condicionais de `executionType` (Webhook, Scraping, Base de Conhecimento) sumiram da interface, impossibilitando a configuração dessas ferramentas. O parser de arquivos PDF/Excel também foi desvinculado.
- **Resolução Proposta:** Restaurar renderização condicional baseada no `skill.executionType` e reimplementar o File Reader assíncrono com `pdfjs-dist` e `xlsx`.