# PRD — Quadro de Missões (MVP)

**Versão:** 1.0 · **Data:** 09/10/2026
**Projeto:** Projeto de Extensão "TI e Sociedade" — Universidade Positivo
**Parceiro (cliente):** Arthur Oliveira Struve
**Marcos:** app no ar para validar com o parceiro até **19/10** · melhorias até **26/10** · vídeo final e entrega em **03/11**

---

## 1. Visão geral

O **Quadro de Missões** é um aplicativo web mobile-first (PWA) que conecta jogadores de **RPG de mesa, jogos de tabuleiro e TCG** em **Curitiba**. A pessoa encontra ou cria sessões ("missões"), descobre locais parceiros no mapa e constrói um histórico de reputação que cresce automaticamente conforme joga.

### O problema (relato do parceiro)
- Quem chega na cidade não sabe onde nem com quem jogar. O parceiro só achou um grupo de WhatsApp fechado, por indicação, num evento presencial.
- Existem locais para jogar em Curitiba, mas não há um canal público e centralizado para encontrar grupos, sessões e torneios.
- Não há como saber se um desconhecido é confiável.

### Objetivo do MVP
Entregar um app **funcionando e publicado** que permita, de ponta a ponta: cadastrar-se → criar ou encontrar uma missão num local verificado → pedir entrada → ser aprovado → combinar pelo WhatsApp/Discord → concluir a missão → ver o nível de reputação subir.

### Não-objetivos (fora do escopo deste semestre)
- Chat interno (a conversa migra para WhatsApp/Discord depois da aprovação).
- Pagamento real (Pix/Mercado Pago/Asaas). Fica como roadmap; no MVP o valor de mesa paga é só informativo.
- Anúncios (AdMob) e qualquer monetização ativa.
- Publicação nas lojas (Google Play / App Store).
- Gestão completa de torneios (chaveamento, resultados). Torneios entram só como **divulgação**.
- Verificação de CPF na Receita Federal (só validação matemática).
- Cadastro aberto de locais por qualquer usuário (locais são aprovados por um admin).

---

## 2. Público e papéis

Todos usam **o mesmo perfil**. Os "papéis" são contextuais, não tipos de conta:

| Papel | Como aparece no sistema |
|---|---|
| Jogador | Qualquer usuário que pede entrada em uma missão |
| Mestre / organizador | Usuário que cria uma missão (é o *host* dela) |
| Estabelecimento | Local cadastrado em `venues`, aprovado por admin (café, ludoteca, loja de TCG) |
| Admin | Usuário com `role = 'admin'` (equipe do projeto) |

- Público: **maiores de 18 anos**.
- Foco geográfico: **Curitiba**. Sessões online são permitidas.

---

## 3. Stack técnica (decisão)

> Esta stack **substitui o FlutterFlow** citado na pesquisa de tecnologias. O desenvolvimento será feito pelo Claude Code, que escreve código mas não opera editores visuais. O restante da pesquisa foi mantido (Supabase, mapa, validação de CPF).

| Camada | Escolha | Observação |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Actions para mutações |
| UI | **Tailwind CSS + shadcn/ui** | Mobile-first, acessível |
| Backend/BD | **Supabase** (Postgres, Auth, RLS, RPC) | Plano gratuito, sem cartão |
| Mapa | **Leaflet + OpenStreetMap** (`react-leaflet`) | Gratuito e sem cartão (Mapbox exige cartão no cadastro) |
| Formulários | `react-hook-form` + `zod` | Validação compartilhada cliente/servidor |
| Testes | **Vitest** (unidade) + smoke test manual do fluxo principal | Playwright opcional |
| Deploy | **Vercel** (plano gratuito) | Gera a URL para validar com o Arthur |
| PWA | `manifest.webmanifest` + ícones | Instalável no celular; sem service worker complexo |

**Idioma:** toda a interface em **português do Brasil**. Identificadores de código, nomes de tabelas e comentários técnicos em inglês. Datas em `America/Sao_Paulo`, guardadas como `timestamptz`.

---

## 4. Requisitos funcionais

Prioridades: **P0** = obrigatório no MVP · **P1** = desejável · **P2** = se sobrar tempo.

### RF-01 — Autenticação e cadastro (P0)
- Cadastro com: nome de exibição, e-mail, senha, **CPF**, **data de nascimento**, telefone (opcional), aceite dos termos/LGPD.
- Login, logout e sessão persistente (Supabase Auth, e-mail + senha).
- **CPF:** validar com **Módulo 11** (rejeitar sequências como 111.111.111-11) e garantir unicidade. Guardar apenas os 11 dígitos.
- **Idade:** bloquear menores de 18 anos (validar no servidor e no banco).
- **Critérios de aceite:** CPF inválido ou repetido mostra erro claro em pt-BR; menor de 18 não conclui o cadastro; após o cadastro o usuário cai na home logado.

### RF-02 — Perfil (P0)
- Editar: nome, bio curta, avatar (opcional), jogos de interesse (RPG / jogo de tabuleiro / TCG), **disponibilidade** (dias da semana), nível de experiência autodeclarado só como *preferência de filtro* (o **nível oficial** vem do ranking).
- Página pública do perfil mostra: nível, XP, selo de reputação, jogos de interesse e **histórico** (missões jogadas, missões mestradas, torneios).
- CPF, data de nascimento e telefone **nunca** aparecem para outros usuários.
- **Critério de aceite:** abrir o perfil de outro usuário não expõe nenhum dado privado (verificar via RLS).

### RF-03 — Missões / sessões (P0, prioridade nº 1 do parceiro)
- **Criar missão:** título, tipo de jogo (RPG / tabuleiro / TCG), sistema ou jogo (texto livre, ex.: "D&D 5e"), tipo (**mesa** ou **torneio**), modalidade (**presencial** ou **online**), data e hora, duração, número de vagas, recorrência (**única** ou **semanal**), nível mínimo recomendado, descrição, mesa paga (sim/não + valor informativo).
- **Presencial:** exige escolher um **local verificado** (`venues.is_verified = true`).
- **Online:** exige um link externo (Discord, Meet etc.).
- **Contato:** o mestre informa um link de WhatsApp ou Discord que só é revelado a participantes aprovados (ver RF-06).
- **Listar e filtrar:** por tipo de jogo, modalidade, data, tipo (mesa/torneio), local e nível. Ordenar por data mais próxima. Mostrar vagas restantes.
- **Sugestão (P1):** destacar "combina com você" quando o dia da semana bate com a disponibilidade do usuário.
- **Detalhe da missão:** informações completas, mestre (com nível), participantes aprovados, botão de ação conforme o estado do usuário.
- **Fluxo de entrada:**
  1. Jogador clica **"Pedir para entrar"** → status `pending`.
  2. Mestre vê os pedidos (com o perfil/nível do solicitante) e **aprova ou recusa**.
  3. Se aprovado, o jogador passa a ver o link de contato e o link online.
  4. Jogador ou mestre podem cancelar; vagas são liberadas.
- **Recorrência semanal:** ao concluir uma missão semanal, o sistema oferece **"Criar a próxima"** copiando os dados com a data +7 dias (sem automação em background).
- **Concluir missão:** só o mestre; marca quem **compareceu** e quem **faltou** e dispara o ranking (RF-05).
- **Critérios de aceite:** não é possível entrar além do limite de vagas; mestre não pede entrada na própria missão; usuário não aprovado nunca recebe o link de contato (garantido por RLS, não só pela interface).

### RF-04 — Locais / estabelecimentos (P0)
- Listagem e **mapa** (Leaflet/OSM) com pinos dos locais verificados em Curitiba; ao tocar no pino, mostrar nome, endereço, tipos de jogo e missões futuras no local.
- Página do local com missões agendadas.
- Qualquer usuário logado pode **sugerir** um local (P1); ele só aparece publicamente depois que um admin marcar `is_verified = true`.
- **Seed obrigatório:** Joy Joy Café (indicado pelo parceiro, próximo ao Jardim Botânico). **Endereço e coordenadas reais devem ser confirmados com o Arthur** — usar valores provisórios marcados com `TODO` até lá.
- **Critério de aceite:** local não verificado não aparece na lista, no mapa nem no formulário de criação de missão.

### RF-05 — Nível e reputação (P0)
O nível é **calculado no servidor**; o cliente nunca grava XP.

| Evento | Pontos (XP) |
|---|---|
| Missão concluída como jogador, com presença | +10 |
| Missão concluída como mestre | +15 |
| Participação em torneio com presença | +20 |
| Falta (no-show) sem cancelar com antecedência | −15 |
| Denúncia confirmada por admin | −30 |

| Nível | Nome | XP |
|---|---|---|
| 1 | Novato | 0–49 |
| 2 | Aventureiro | 50–149 |
| 3 | Veterano | 150–299 |
| 4 | Mestre | 300+ |

- XP nunca fica abaixo de 0.
- Os valores acima ficam centralizados em **um único lugar** (constantes no banco ou tabela de configuração) para facilitar ajustes após o feedback do parceiro.
- Mostrar no perfil: nível, barra de progresso até o próximo nível, contadores (jogadas, mestradas, faltas).
- **Critério de aceite:** concluir uma missão com 3 presentes e 1 faltoso atualiza o XP e o nível de cada um corretamente e gera linhas em `reputation_events`; chamar a função de fora do mestre é bloqueado.

### RF-06 — Segurança e confiança (P0)
- Sessões presenciais **só em locais verificados**.
- **Denúncia** de perfil ou de missão: motivo (lista fixa + campo livre), registrada em `reports` com status `open`.
- **Flag automático:** perfil com **3 ou mais denúncias abertas** exibe selo "Em análise" para o mestre ao avaliar pedidos de entrada.
- **Admin** analisa denúncias: *confirmar* (aplica −30 XP) ou *descartar*.
- Contato (WhatsApp/Discord) revelado apenas a participantes aprovados e ao mestre.
- **Sem chat interno.** O app gera o link `https://wa.me/55<numero>` ou usa o link de Discord informado.
- **Critério de aceite:** um usuário não consegue ler denúncias de outros nem alterar o status delas.

### RF-07 — Notificações dentro do app (P1)
- Central de notificações com contador na navegação: pedido de entrada recebido, pedido aprovado/recusado, missão cancelada, missão concluída.
- Marcar como lida.
- **P2:** push (OneSignal) e lembrete "sua missão começa em 2 horas".

### RF-08 — Painel admin mínimo (P0)
- Rota `/admin` acessível só com `role = 'admin'`.
- Abas: **Locais pendentes** (aprovar/rejeitar), **Denúncias** (confirmar/descartar), **Usuários** (somente leitura).
- Criar o primeiro admin via SQL documentado no README.

### RF-09 — Página inicial pública (P1)
- Landing com proposta de valor, botão "Criar conta" e prévia das próximas missões e locais (somente dados públicos).
- Seção de **lista de espera** (e-mail) é P2.

---

## 5. Modelo de dados (guia para as migrations)

Schema `public`. Todas as tabelas com **RLS habilitado**. Chaves `uuid` com `gen_random_uuid()`.

```sql
-- Enums
create type game_type          as enum ('rpg','boardgame','tcg');
create type session_mode       as enum ('presencial','online');
create type session_kind       as enum ('mesa','torneio');
create type recurrence_kind    as enum ('none','weekly');
create type session_status     as enum ('open','cancelled','completed');
create type participant_status as enum ('pending','approved','rejected','cancelled');
create type report_status      as enum ('open','confirmed','dismissed');
create type app_role           as enum ('user','admin');
create type reputation_kind    as enum ('played','hosted','tournament','no_show','report_confirmed');

-- Perfil público
profiles(
  id uuid primary key references auth.users on delete cascade,
  display_name text not null, bio text, avatar_url text,
  interests game_type[] not null default '{}',
  availability smallint[] not null default '{}',   -- 0=domingo ... 6=sábado
  role app_role not null default 'user',
  created_at timestamptz not null default now())

-- Dados sensíveis (LGPD): só o próprio dono lê/escreve
private_profiles(
  user_id uuid primary key references profiles on delete cascade,
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  birth_date date not null, phone text)

-- Estatísticas calculadas no servidor (SEM policy de escrita para clientes)
player_stats(
  user_id uuid primary key references profiles on delete cascade,
  xp int not null default 0 check (xp >= 0), level smallint not null default 1,
  sessions_played int not null default 0, sessions_hosted int not null default 0,
  no_shows int not null default 0, updated_at timestamptz not null default now())

venues(
  id uuid primary key default gen_random_uuid(),
  name text not null, address text not null, city text not null default 'Curitiba',
  lat double precision not null, lng double precision not null,
  description text, game_types game_type[] not null default '{}',
  instagram text, is_verified boolean not null default false,
  suggested_by uuid references profiles, created_at timestamptz not null default now())

sessions(
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles,
  venue_id uuid references venues,                 -- obrigatório se presencial
  title text not null, game_type game_type not null, system_name text,
  kind session_kind not null default 'mesa', mode session_mode not null,
  description text, starts_at timestamptz not null,
  duration_minutes int not null default 180, max_players int not null check (max_players between 2 and 20),
  recurrence recurrence_kind not null default 'none', min_level smallint not null default 1,
  is_paid boolean not null default false, price_cents int,
  status session_status not null default 'open', created_at timestamptz not null default now())

-- Links de contato: visíveis só para o mestre e participantes aprovados
session_contacts(
  session_id uuid primary key references sessions on delete cascade,
  contact_url text, online_url text)

session_participants(
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  status participant_status not null default 'pending',
  attended boolean,                                -- preenchido ao concluir
  created_at timestamptz not null default now(),
  unique (session_id, user_id))

reputation_events(                                 -- SEM policy de escrita para clientes
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles, session_id uuid references sessions,
  kind reputation_kind not null, points int not null, created_at timestamptz not null default now())

reports(
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles,
  target_user_id uuid references profiles, target_session_id uuid references sessions,
  reason text not null, details text, status report_status not null default 'open',
  created_at timestamptz not null default now(),
  check (target_user_id is not null or target_session_id is not null))

notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  type text not null, title text not null, body text, link text,
  read_at timestamptz, created_at timestamptz not null default now())
```

### Funções (RPC, `security definer` com `search_path` fixo)
Toda regra que mexe em reputação, vagas ou permissões roda **no banco**:

| Função | Quem pode | O que faz |
|---|---|---|
| `handle_new_user()` (trigger em `auth.users`) | sistema | Cria `profiles` e `player_stats` |
| `request_join(session_id)` | usuário logado | Cria `pending`; barra mestre, sessão cancelada/concluída, duplicidade e menor nível exigido (aviso, não bloqueio) |
| `respond_join(session_id, user_id, approve)` | só o mestre | Aprova (respeitando vagas) ou recusa; notifica |
| `cancel_participation(session_id)` | próprio participante | Cancela e libera vaga |
| `complete_session(session_id, attended_user_ids uuid[])` | só o mestre | Marca presença/faltas, grava `reputation_events`, atualiza `player_stats` e nível, notifica |
| `submit_report(...)` | usuário logado | Cria denúncia |
| `review_report(report_id, confirm)` | só admin | Confirma (−30 XP) ou descarta |
| `approve_venue(venue_id, approve)` | só admin | Verifica ou remove local |

### Políticas RLS (resumo)
- `profiles`: leitura pública para logados; update só do próprio.
- `private_profiles`: select/insert/update **apenas** `user_id = auth.uid()`.
- `player_stats`, `reputation_events`: **select** para logados; **nenhuma** escrita direta.
- `venues`: select se `is_verified` **ou** sugerido por mim **ou** sou admin; insert por logado (nasce `is_verified = false`); update só admin.
- `sessions`: select para logados; insert só com `host_id = auth.uid()`, presencial apenas com `venue` verificado (trigger); update/delete só do mestre.
- `session_contacts`: select só para o mestre e participantes `approved`.
- `session_participants`: select para o próprio usuário e para o mestre; escrita só via RPC.
- `reports`: insert por logado; select só o autor e admin; update só admin (via RPC).
- `notifications`: tudo restrito a `user_id = auth.uid()`.

---

## 6. Telas e rotas

| Rota | Tela | Prioridade |
|---|---|---|
| `/` | Landing / home pública | P1 |
| `/cadastro`, `/entrar` | Cadastro e login | P0 |
| `/missoes` | Lista de missões com filtros | P0 |
| `/missoes/nova` | Criar missão | P0 |
| `/missoes/[id]` | Detalhe, pedido de entrada, gestão de pedidos, concluir missão | P0 |
| `/locais` | Mapa + lista de locais | P0 |
| `/locais/[id]` | Detalhe do local e missões futuras | P0 |
| `/perfil/[id]` | Perfil público, nível e histórico | P0 |
| `/perfil/editar` | Editar perfil e disponibilidade | P0 |
| `/notificacoes` | Central de notificações | P1 |
| `/admin` | Locais pendentes, denúncias, usuários | P0 |

Navegação inferior no celular: **Missões · Locais · Criar · Avisos · Perfil**.

---

## 7. Design

Identidade já usada na apresentação ao parceiro — manter a coerência:

| Token | Valor | Uso |
|---|---|---|
| Roxo profundo | `#2D1B4E` | Cor primária, cabeçalhos, botões principais |
| Roxo escuro | `#1E1236` | Fundos escuros, texto sobre dourado |
| Pergaminho | `#F4E9D8` | Fundo geral |
| Dourado | `#D4A017` | Destaque, nível, selos |
| Tinta | `#2A2320` | Texto |

- Títulos em fonte **serifada** de personalidade; texto em sans-serif legível. Carregar via `next/font`.
- Tom de voz: simples e direto, no vocabulário do jogador ("missão", "mestre"), sem excesso de temática que atrapalhe a clareza.
- Mobile-first (largura-base 390px), áreas de toque ≥ 44px, foco de teclado visível, contraste AA, `prefers-reduced-motion` respeitado.
- Estados vazios com ação ("Nenhuma missão por aqui. Crie a primeira").
- Mensagens de erro dizem o que houve e como corrigir.

---

## 8. Requisitos não funcionais

- **LGPD:** coletar só o necessário; CPF e data de nascimento protegidos por RLS; texto de consentimento no cadastro; função/página para **excluir a conta** e os dados (P1).
- **Segurança:** RLS em todas as tabelas; **nunca** expor a `service_role` no cliente; segredos só em variáveis de ambiente; validação com `zod` no servidor; proteção de rotas `/admin` no servidor.
- **Qualidade:** TypeScript estrito; `lint`, `typecheck` e testes passando antes de cada fase ser dada como concluída.
- **Desempenho:** primeira carga da lista de missões < 3 s em 4G; paginação (20 por página).
- **Acessibilidade:** formulários com rótulos, erros associados aos campos.
- **Custo:** R$ 0 — tudo em planos gratuitos sem cartão.

---

## 9. Dados de demonstração (seed)

Script `supabase/seed.sql` (ou `scripts/seed.ts`) para a gravação do vídeo e a validação com o parceiro:
- 1 admin e 5 usuários fictícios com níveis variados (nomes claramente fictícios).
- Local **Joy Joy Café** (verificado; endereço/coordenadas provisórios com `TODO`) e 1–2 locais fictícios identificados como "exemplo".
- 6–8 missões futuras variadas (RPG, tabuleiro, TCG; presencial e online; 1 torneio; 1 semanal).
- Alguns pedidos pendentes e 1 missão já concluída gerando histórico.

---

## 10. Plano de entrega

| Fase | Período | Entrega | Pronto quando |
|---|---|---|---|
| 0 | 09–10/10 | Setup: Next.js, Tailwind, shadcn, Supabase client, lint/test, `CLAUDE.md`, README | `npm run dev` abre a home; `lint`/`typecheck` passam |
| 1 | 10–12/10 | Schema, RLS, funções, trigger de novo usuário, cadastro/login, CPF Módulo 11 | Cadastro cria perfil + stats; CPF inválido barrado; testes do CPF passam |
| 2 | 12–14/10 | Missões: criar, listar, filtrar, detalhe, pedir entrada, aprovar/recusar, cancelar | Fluxo completo entre 2 contas; vagas respeitadas |
| 3 | 14–16/10 | Locais: lista, mapa Leaflet, página do local, seed do Joy Joy Café | Mapa mostra só locais verificados |
| 4 | 16–17/10 | Concluir missão, ranking, perfil com nível e histórico | Testes das regras de XP/nível passam; perfil reflete a conclusão |
| 5 | 17–18/10 | Denúncias, flag, admin, notificações in-app | Admin aprova local e confirma denúncia |
| 6 | 18–19/10 | Polimento, seed de demonstração, PWA manifest, **deploy na Vercel** | URL pública funcionando para o Arthur testar |
| 7 | 20–26/10 | **Etapa 7:** ajustes pelo feedback do parceiro | Lista de melhorias fechada |
| 8 | 27/10–02/11 | **Etapa 8:** vídeo final, publicação, evidências | Entrega em 03/11 |

Ao fim de cada fase: commit, resumo do que foi feito e do que ficou pendente.

---

## 11. Roteiro de demonstração (vídeo)

1. Cadastro de um usuário novo (mostrar erro de CPF inválido).
2. Mapa de locais com o Joy Joy Café.
3. Mestre cria uma missão presencial no local verificado.
4. Outro usuário pede para entrar; o mestre aprova; o link de contato aparece.
5. Mestre conclui a missão marcando presença e falta.
6. Perfil mostra XP, nível e histórico atualizados.
7. Denúncia enviada e revisada no painel admin.

---

## 12. Riscos e perguntas em aberto

| Item | Tratamento |
|---|---|
| Endereço/coordenadas reais do Joy Joy Café | Perguntar ao Arthur; usar `TODO` até lá |
| Torneios: só divulgar ou gerenciar chaveamento? | MVP só divulga (decisão provisória); confirmar na validação |
| Missões recorrentes: automáticas ou manuais? | MVP usa "Criar a próxima" manual |
| Pesos de XP e nomes dos níveis | Valores iniciais acima; ajustáveis após feedback |
| Confirmação de e-mail no Supabase | Desativar durante a demonstração para agilizar o cadastro |
| Prazo curto (~25 dias) | Cortar P1/P2 antes de atrasar P0 |

---

## 13. Definição de pronto do MVP

- [ ] Todos os itens **P0** implementados e testados manualmente com 2+ contas.
- [ ] RLS ativo em todas as tabelas; verificado que dados privados não vazam.
- [ ] `lint`, `typecheck` e testes passando.
- [ ] README com instruções de instalação, variáveis de ambiente, migrations, seed e criação do admin.
- [ ] App publicado com URL pública e dados de demonstração.
- [ ] Nenhum segredo no repositório.
