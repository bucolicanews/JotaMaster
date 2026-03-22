# Guia de Desenvolvimento de Módulos (Micro-Frontends)

## 1. Visão Geral
Bem-vindo ao ecossistema **JOTA Master**. Este documento orienta desenvolvedores parceiros ou equipes internas na criação de novos módulos (Blocos de Lego) que serão acoplados à nossa Placa-mãe.

Nossa arquitetura utiliza **Iframes com Sandbox Restrito** para injeção de aplicações hospedadas remotamente (CDNs).

## 2. Requisitos Técnicos e de Segurança (Obrigatório)

Para que seu módulo funcione dentro do Jota Master, ele deve respeitar as seguintes regras:

### 2.1. Protocolo e Hospedagem
- O módulo **DEVE** ser hospedado com certificado SSL/TLS válido (`https://`).
- O Master rejeitará conexões HTTP simples.
- Recomendamos CDNs modernas como Vercel, Netlify, AWS CloudFront ou Cloudflare.

### 2.2. Cabeçalhos de Segurança (CORS e Frame-Ancestors)
Como o módulo rodará dentro de um Iframe do Jota Master, seu servidor/CDN deve permitir o encapsulamento:
- `Content-Security-Policy: frame-ancestors 'self' https://*.jotaempresas.com;`
- Evite o uso de `X-Frame-Options: DENY` ou `SAMEORIGIN`.

### 2.3. Design e UX
- O Jota Master lida com o menu lateral e o cabeçalho. Seu módulo terá 100% da área útil restante (`width: 100vw; height: 100vh;`).
- Não crie menus de navegação globais ou barras superiores redundantes. Vá direto à funcionalidade.
- Garanta design responsivo (Mobile-First), pois a área do iframe se ajustará automaticamente.
- Recomendamos o uso de Tailwind CSS e shadcn/ui para manter a consistência visual.

### 2.4. Comunicação e Autenticação (PostMessage)
Seu módulo **NÃO** terá acesso aos cookies, `localStorage` ou tokens do Jota Master devido às políticas de isolamento do navegador.
- Se você precisar saber qual é o `user_id` atual logado, implemente um listener para `window.addEventListener('message')`.
- O Jota Master enviará um payload seguro inicial contendo os dados de contexto estritamente necessários via `window.postMessage`.

## 3. Fluxo de Publicação
1. Desenvolva sua aplicação React/Vue/Svelte normalmente.
2. Faça o Build estático (Ex: `npm run build`).
3. Faça o deploy da pasta `dist`/`build` na sua CDN.
4. Forneça a URL de produção (Ex: `https://meumodulo.vercel.app`) para o Administrador do Jota Master cadastrá-la no Marketplace.