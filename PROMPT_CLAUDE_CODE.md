# Quadro de Missões — Guia de uso no Claude Code

Este arquivo tem: (1) preparação, (2) `CLAUDE.md` sugerido, (3) prompt inicial, (4) prompts por fase, (5) prompt de revisão/segurança/deploy.
O `PRD.md` é a fonte da verdade. Prazo final: **03/11/2026**. Etapa 6 (MVP + vídeo + registros): **19/10**.

---

## 1. Preparação (30–40 min, uma vez só)

1. Instale **Node.js 20+** e **Git**.
2. Crie contas gratuitas: **GitHub**, **Supabase** (crie um projeto, região São Paulo; guarde `Project URL`, `anon key` e `service_role key`) e **Vercel** (login com GitHub).
3. Crie a pasta e o repositório:
   ```bash
   mkdir quadro-de-missoes && cd quadro-de-missoes
   git init
   ```
4. Copie o `PRD.md` para a raiz da pasta e crie o `CLAUDE.md` (seção 2).
5. Abra o Claude Code na pasta: `claude`.
6. **Nunca cole a `service_role key` no chat.** Ela fica só no `.env.local` (que você cria à mão) e nas variáveis da Vercel.

---

## 2. CLAUDE.md sugerido (salve na raiz)

```markdown
# Quadro de Missões

App web (PWA) que conecta jogadores de RPG, board games e TCG em Curitiba. Projeto de extensão (Universidade Positivo). Prazo final: 03/11/2026.

## Fonte da verdade
- Leia `PRD.md` antes de qualquer tarefa. Se algo conflitar, o PRD vence; se o PRD for ambíguo, escolha a opção mais simples e registre em `DECISIONS.md`.

## Stack
Next.js (App Router) + TypeScript estrito, Tailwind + shadcn/ui, Supabase (Postgres, Auth, RLS, funções `security definer`), Leaflet + OpenStreetMap, react-hook-form + zod, Vitest, deploy na Vercel.

## Regras
- Idioma da interface e dos textos: português do Brasil.
- Regras de XP, nível, presença e denúncias rodam SOMENTE no banco (RPC); o cliente nunca grava XP.
- RLS ligado em todas as tabelas. CPF, data de nascimento e links de contato nunca vazam para quem não tem permissão.
- Nunca commitar `.env*`. Usar `.env.example`.
- Antes de concluir qualquer fase: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` devem passar.
- Um commit por fase, mensagem em português no imperativo ("Adiciona cadastro com validação de CPF").
- Prioridade: P0 antes de P1 antes de P2. Não implementar nada fora do PRD sem perguntar.
- Mobile-first (teste em 390px). Acessibilidade: contraste, foco visível, labels.

## Design
Roxo #2D1B4E, roxo escuro #1E1236, pergaminho #F4E9D8, dourado #D4A017, tinta #2A2320. Títulos em serifa (Cambria/fallback serif), corpo em sans.

## Comandos
npm run dev | lint | typecheck | test | build
```

---

## 3. Prompt inicial (cole no primeiro turno)

```text
Você é o desenvolvedor principal do "Quadro de Missões". Leia o arquivo PRD.md inteiro e o CLAUDE.md.

Contexto: sou um estudante de ADS construindo o MVP sozinho, com prazo curto (MVP funcional em 19/10/2026, entrega final em 03/11/2026). Preciso de um app que funcione de verdade e que eu consiga explicar numa apresentação.

Antes de escrever código:
1. Resuma em até 15 linhas o que você entendeu do produto e do escopo P0.
2. Liste dúvidas ou ambiguidades do PRD (máx. 8). Para cada uma, proponha a sua escolha padrão para eu só aprovar.
3. Proponha a estrutura de pastas e a ordem de execução seguindo as Fases 0–6 do PRD, com estimativa em horas.

Aguarde minha aprovação antes de criar arquivos.

Depois de aprovado, trabalhe fase por fase:
- Ao fim de cada fase, rode lint, typecheck, testes e build; corrija o que falhar.
- Faça um commit por fase.
- Me entregue um resumo de no máximo 10 linhas: o que foi feito, como testar manualmente, o que ficou pendente.
- Pare e espere eu dizer "próxima fase".

Regras: não invente requisitos; não implemente P1/P2 antes de todo P0 estar pronto; mantenha o código simples e comentado nos pontos não óbvios (vou ter que explicá-lo); se precisar de um segredo ou de uma ação minha (criar chave, rodar SQL no painel), me diga exatamente o passo.
```

---

## 4. Prompts por fase

### Fase 0 — Setup (09–10/10)
```text
Execute a Fase 0 do PRD: crie o projeto Next.js (App Router, TypeScript estrito, Tailwind, ESLint), instale e configure shadcn/ui, defina os tokens de cor do design no Tailwind, crie layout base mobile-first (cabeçalho, navegação inferior), configure Vitest, scripts typecheck/test, .env.example, manifest PWA e README com instruções de execução. Crie o cliente Supabase (browser e server) lendo variáveis de ambiente. Não crie tabelas ainda. Ao final rode tudo e faça o commit.
```

### Fase 1 — Banco, auth e CPF (10–12/10)
```text
Execute a Fase 1: crie as migrações SQL em supabase/migrations com enums, tabelas, índices, triggers (handle_new_user) e políticas RLS exatamente como na seção 5 do PRD. Crie supabase/seed.sql com os dados da seção 9. Implemente cadastro (/cadastro) e login (/entrar) com Supabase Auth, validação de CPF por Módulo 11 (função pura + testes unitários com CPFs válidos, inválidos e repetidos), checagem de 18+, e gravação de CPF/nascimento em private_profiles. Middleware protegendo rotas autenticadas. Me explique como aplicar as migrações no meu projeto Supabase (SQL Editor ou supabase CLI) e como desligar a confirmação de e-mail para a demo.
```

### Fase 2 — Missões/sessões (12–14/10)
```text
Execute a Fase 2: telas /missoes (lista com filtros por jogo, sistema, nível, dia/horário, presencial/online), /missoes/nova (formulário com zod; presencial exige local verificado) e /missoes/[id] (detalhe, lista de participantes, botão pedir para entrar, aceitar/recusar pelo anfitrião, cancelar participação). Use as RPCs request_join, respond_join e cancel_participation. O link de contato (WhatsApp/Discord) só aparece para participantes aceitos. Estados de loading/vazio/erro em todas as telas. Testes para as regras de negócio que ficarem fora do banco.
```

### Fase 3 — Locais e mapa (14–16/10)
```text
Execute a Fase 3: /locais (lista + mapa Leaflet/OpenStreetMap com marcadores, importando Leaflet de forma segura para o Next — dynamic import sem SSR) e /locais/[id] (detalhes, endereço, horários, jogos suportados, missões futuras naquele local). Cadastro de local por usuário entra como "pendente"; só admin aprova (approve_venue). Use o Joy Joy Café como local semente com endereço/coordenadas marcados como TODO a confirmar com o Arthur.
```

### Fase 4 — Concluir sessão, ranking e perfil (16–17/10)
```text
Execute a Fase 4: fluxo de concluir sessão (complete_session) em que o anfitrião marca presentes/faltantes, aplicando XP no servidor (+10 jogou, +15 anfitrião, +20 torneio, −15 falta), recalculando nível (Novato 0–49, Aventureiro 50–149, Veterano 150–299, Mestre 300+). Perfil público /perfil/[id] com nível, histórico, estatísticas e selos; /perfil/editar. Garanta que o cliente não consiga alterar XP (teste isso explicitamente).
```

### Fase 5 — Denúncias, admin e notificações (17–18/10)
```text
Execute a Fase 5: denunciar usuário/missão/local (submit_report), painel /admin (revisar denúncias com review_report, aprovar locais, listar usuários) restrito a admin, e /notificacoes in-app (pedido recebido, aceito/recusado, sessão cancelada, XP ganho). Denúncia confirmada aplica −30 XP. Sem push externo por enquanto.
```

### Fase 6 — Polimento, seed e deploy (18–19/10)
```text
Execute a Fase 6: revisão de UX no mobile (390px), estados vazios, textos em português, acessibilidade básica, seed de demonstração realista (usuários fictícios, locais, missões futuras e passadas), ícones PWA e instalação, e deploy na Vercel. Me guie nas variáveis de ambiente da Vercel e na configuração de URL do Supabase Auth. Ao final, gere um roteiro de teste manual passo a passo (login → criar missão → pedir entrada → aceitar → concluir → ver XP) para eu gravar o vídeo de demonstração.
```

### Fases 7–8 (Etapa 7 e fechamento)
```text
Com base no feedback de validação que vou te colar, liste as melhorias por impacto x esforço, implemente as de maior impacto dentro de 3 dias e atualize o README e o PRD (seção "mudanças após validação").
```

---

## 5. Prompt de revisão, segurança e deploy (rode antes de gravar o vídeo)

```text
Faça uma auditoria completa, sem alterar nada ainda, e me entregue um relatório priorizado (crítico / importante / baixo):
1. Segurança: para cada tabela, confirme que RLS está ativo e teste mentalmente (ou com testes SQL) que um usuário comum NÃO consegue ler CPF/nascimento de outro, NÃO consegue editar XP/nível, NÃO consegue aprovar local ou revisar denúncia, e NÃO vê links de contato de sessões em que não participa.
2. Segredos: procure por chaves no código, histórico git e bundle do cliente. A service_role não pode existir no front-end.
3. Validação: todo input tem zod no cliente E restrição no banco.
4. LGPD: dados mínimos, texto de consentimento no cadastro, forma de excluir conta.
5. Qualidade: lint, typecheck, testes e build; rotas sem estado de erro; telas quebradas em 390px.
6. Aderência ao PRD: tabela requisito x status (feito/parcial/faltando).
Depois me pergunte quais correções aplicar.
```

---

## 6. Dicas para não travar

- **Peça pouco por vez.** Uma fase por prompt. Se a resposta ficar enorme, use `/clear` e comece a próxima fase com: "Leia PRD.md e CLAUDE.md; estamos na Fase N; o estado atual está no git log".
- **Use `/compact`** quando o contexto encher.
- **Se algo quebrar**, cole o erro exato + o que você fez; peça: "ache a causa raiz antes de mudar código".
- **Commit sempre** antes de pedir algo grande: dá para voltar com `git reset --hard`.
- **Corte escopo cedo.** Se na quarta-feira (14/10) a Fase 2 não estiver pronta, mova denúncias/notificações para P2 e entregue só o essencial.
- **Guarde evidências** (prints, commits, vídeo) para a Etapa 6.
