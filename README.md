# Quadro de Missões

App web (PWA, mobile-first) que conecta jogadores de **RPG de mesa, jogos de tabuleiro e TCG** em Curitiba: encontre ou crie missões, descubra locais verificados e construa sua reputação jogando.

Projeto de Extensão "TI e Sociedade", Universidade Positivo. Requisitos em [`PRD.md`](PRD.md); decisões de projeto em [`DECISIONS.md`](DECISIONS.md).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · Supabase (Postgres, Auth, RLS) · Leaflet + OpenStreetMap · react-hook-form + zod · Vitest · Vercel.

## Como rodar

Pré-requisitos: **Node.js 20+** e uma conta gratuita no [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local   # depois preencha os valores (veja abaixo)
npm run dev                  # abre em http://localhost:3000
```

### Variáveis de ambiente

No painel do Supabase, abra **Project Settings > API Keys** e copie para o `.env.local`:

| Variável | Onde achar | Pública? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | sim |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | API Keys > Publishable key (`sb_publishable_...`) | sim (protegida por RLS) |
| `SUPABASE_SECRET_KEY` | API Keys > Secret key (`sb_secret_...`) | **não**: só servidor, nunca commitar nem colar em chat |

> Até a Fase 1 a home e as telas provisórias funcionam sem essas variáveis.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (TypeScript estrito) |
| `npm test` | Testes unitários (Vitest) |
| `npm run build` | Build de produção |
| `npm run icons` | Regenera os ícones PWA a partir de `src/app/icon.svg` |

## Estrutura

```
src/
  app/
    page.tsx          home pública
    (app)/            telas logadas com cabeçalho + navegação inferior
    manifest.ts       manifesto PWA
  components/
    ui/               componentes shadcn/ui
    layout/           cabeçalho e navegação inferior
  lib/
    supabase/         clientes Supabase (navegador e servidor)
    env.ts            leitura das variáveis de ambiente
supabase/migrations/  schema, RLS e funções (a partir da Fase 1)
scripts/              utilitários (ícones, seed)
```

## Banco de dados, seed e admin

A partir da Fase 1: instruções para aplicar as migrations, popular os dados de demonstração e criar o primeiro admin.
