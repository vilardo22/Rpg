# Quadro de Missões

App web (PWA, mobile-first) que conecta jogadores de **RPG de mesa, jogos de tabuleiro e TCG** em Curitiba: encontre ou crie missões, descubra locais verificados e construa sua reputação jogando.

Projeto de Extensão "TI e Sociedade", Universidade Positivo. Requisitos em [`PRD.md`](PRD.md); decisões de projeto em [`DECISIONS.md`](DECISIONS.md).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · Supabase (Postgres, Auth, RLS) · Leaflet + OpenStreetMap · react-hook-form + zod · Vitest · Vercel.

## Como rodar

Pré-requisitos: **Node.js 22.18+** (recomendado 24) e uma conta gratuita no [Supabase](https://supabase.com).

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


## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (TypeScript estrito) |
| `npm test` | Testes unitários (Vitest) |
| `npm run build` | Build de produção |
| `npm run icons` | Regenera os ícones PWA a partir de `src/app/icon.svg` |
| `npm run seed` | Recria os dados de demonstração no Supabase (usa a secret key) |

## Estrutura

```
src/
  app/
    page.tsx          home pública
    (auth)/           cadastro, login e as Server Actions de autenticação
    (app)/            telas logadas com cabeçalho + navegação inferior
    manifest.ts       manifesto PWA
  components/
    ui/               componentes shadcn/ui
    layout/           cabeçalho e navegação inferior
  lib/
    supabase/         clientes Supabase (navegador e servidor)
    env.ts            leitura das variáveis de ambiente
    cpf.ts, age.ts    validação de CPF (Módulo 11) e de 18+
    validation/       schemas zod dos formulários
  proxy.ts            protege as rotas logadas (o antigo middleware)
supabase/migrations/  schema, RLS e funções
supabase/tests/       testes do banco (PGlite)
scripts/              utilitários (ícones, seed)
```

## Banco de dados

O schema, as políticas de segurança (RLS) e as regras de negócio (vagas, XP, denúncias) ficam em `supabase/migrations/`, em 3 arquivos que devem ser aplicados **em ordem**:

1. `20261010000100_schema.sql`: tipos, tabelas, restrições e a configuração de XP/níveis
2. `20261010000200_functions.sql`: gatilhos e funções (RPC)
3. `20261010000300_rls.sql`: permissões e políticas RLS

**Como aplicar (SQL Editor):** no painel do Supabase, abra **SQL Editor > New query**, cole o conteúdo do arquivo 1 e clique em **Run**. Repita com os arquivos 2 e 3.

> Alternativa pela linha de comando: `npx supabase login`, `npx supabase link --project-ref <ref>` e `npx supabase db push`.

### Testes do banco

`npm test` também roda `supabase/tests/`: os testes sobem um Postgres em memória ([PGlite](https://pglite.dev)), aplicam as mesmas migrations e conferem as regras (CPF, 18+, RLS, vagas, XP, denúncias). Não precisam de internet nem de Docker.

### Ajustar XP e níveis

Os pontos e os níveis ficam nas tabelas `reputation_rules` e `levels`. Exemplo, no SQL Editor:

```sql
update public.reputation_rules set points = 12 where kind = 'played';
```

## Dados de demonstração

```bash
npm run seed
```

Cria 1 admin e 5 jogadores fictícios (`<nome>@demo.quadro.dev`, senha `Missoes2026!`), o Joy Joy Café e locais de exemplo, missões futuras, pedidos pendentes, uma missão em andamento (para demonstrar a conclusão) e uma concluída com histórico de XP. Pode rodar de novo: apaga só o que o próprio seed criou.

## Criar o primeiro admin

Depois de criar sua conta pelo app, rode no SQL Editor (trocando o e-mail):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'seu-email@exemplo.com');
```
