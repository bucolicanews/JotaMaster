## [BUG-006] Regressão na Ferramenta de Web Scraping
- **Data:** Sessão Atual
- **Status:** Proposta de Correção enviada.
- **Descrição:** O motor de scraping falhava em sites governamentais por bloqueios de proxy único, e a UI perdeu as instruções vitais de seletores CSS durante a refatoração.
- **Resolução Proposta:** Injeção de "Dual Proxy Strategy" no `taxSkills.ts` e restauração da caixa de dicas (tags de tabelas) no formulário do `Skills.tsx`.