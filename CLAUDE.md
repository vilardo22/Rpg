@AGENTS.md

# Quadro de Missões

App web (PWA) que conecta jogadores de RPG, board games e TCG em Curitiba. Projeto de extensão (Universidade Positivo). Prazo final: 03/11/2026.

## Fonte da verdade
- Leia `PRD.md` antes de qualquer tarefa. Se algo conflitar, o PRD vence; se o PRD for ambíguo, escolha a opção mais simples e registre em `DECISIONS.md`.

## Stack
Next.js 16 (App Router, `src/`, Cache Components desligado) + TypeScript estrito, Tailwind v4 + shadcn/ui (radix), Supabase (Postgres, Auth, RLS, funções `security definer`), Leaflet + OpenStreetMap, react-hook-form + zod, Vitest, deploy na Vercel.
- No Next 16, `middleware.ts` virou `proxy.ts` (função `proxy`). Consulte `node_modules/next/dist/docs/` quando houver dúvida de API.
- Clientes Supabase em `src/lib/supabase/` (`client.ts` navegador, `server.ts` servidor).

## Regras
- Idioma da interface e dos textos: português do Brasil. Identificadores de código e tabelas em inglês.
- Regras de XP, nível, presença e denúncias rodam SOMENTE no banco (RPC); o cliente nunca grava XP.
- RLS ligado em todas as tabelas. CPF, data de nascimento e links de contato nunca vazam para quem não tem permissão.
- Nunca commitar `.env*`. Usar `.env.example`. A secret key (`SUPABASE_SECRET_KEY`) nunca aparece em código de cliente.
- Antes de concluir qualquer fase: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` devem passar.
- Um commit por fase, mensagem em português no imperativo ("Adiciona cadastro com validação de CPF").
- Prioridade: P0 antes de P1 antes de P2. Não implementar nada fora do PRD sem perguntar.
- Mobile-first (teste em 390px), áreas de toque ≥ 44px. Acessibilidade: contraste, foco visível, labels.
- Código simples e comentado nos pontos não óbvios (o autor precisa explicá-lo na apresentação).

## Design
Roxo #2D1B4E, roxo escuro #1E1236, pergaminho #F4E9D8, dourado #D4A017, tinta #2A2320 (tokens em `src/app/globals.css`, utilitários `bg-roxo`, `text-dourado` etc.). Títulos em Fraunces (serifa, `font-heading`), corpo em Inter.

## Comandos
npm run dev | lint | typecheck | test | build | icons
