-- =============================================================================
-- Quadro de Missões — 1/3: tipos, tabelas, restrições e índices (PRD seção 5)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.game_type          as enum ('rpg', 'boardgame', 'tcg');
create type public.session_mode       as enum ('presencial', 'online');
create type public.session_kind       as enum ('mesa', 'torneio');
create type public.recurrence_kind    as enum ('none', 'weekly');
create type public.session_status     as enum ('open', 'cancelled', 'completed');
create type public.participant_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.report_status      as enum ('open', 'confirmed', 'dismissed');
create type public.app_role           as enum ('user', 'admin');
create type public.reputation_kind    as enum ('played', 'hosted', 'tournament', 'no_show', 'report_confirmed');

-- -----------------------------------------------------------------------------
-- Validação de CPF (Módulo 11) também no banco, como segunda barreira.
-- A mesma regra existe em src/lib/cpf.ts (validação no app, com testes).
-- -----------------------------------------------------------------------------
create or replace function public.is_valid_cpf(cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits int[];
  total int;
  check_digit int;
begin
  if cpf is null or cpf !~ '^[0-9]{11}$' then
    return false;
  end if;
  -- Sequências repetidas (000..., 111..., ...) passam na conta mas não são CPFs reais.
  if cpf ~ '^(.)\1{10}$' then
    return false;
  end if;

  digits := array(select substr(cpf, i, 1)::int from generate_series(1, 11) as i);

  -- 1º dígito verificador: pesos 10..2 sobre os 9 primeiros dígitos.
  total := 0;
  for i in 1..9 loop
    total := total + digits[i] * (11 - i);
  end loop;
  check_digit := (total * 10) % 11 % 10;
  if check_digit <> digits[10] then
    return false;
  end if;

  -- 2º dígito verificador: pesos 11..2 sobre os 10 primeiros dígitos.
  total := 0;
  for i in 1..10 loop
    total := total + digits[i] * (12 - i);
  end loop;
  check_digit := (total * 10) % 11 % 10;
  return check_digit = digits[11];
end;
$$;

-- -----------------------------------------------------------------------------
-- Configuração de reputação: os valores de XP e os níveis ficam em UM lugar só
-- (PRD RF-05). Para ajustar depois do feedback do parceiro, basta um UPDATE aqui.
-- -----------------------------------------------------------------------------
create table public.reputation_rules (
  kind   public.reputation_kind primary key,
  points int not null
);

insert into public.reputation_rules (kind, points) values
  ('played',            10),
  ('hosted',            15),
  ('tournament',        20),
  ('no_show',          -15),
  ('report_confirmed', -30);

create table public.levels (
  level  smallint primary key,
  name   text not null,
  min_xp int not null unique
);

insert into public.levels (level, name, min_xp) values
  (1, 'Novato',        0),
  (2, 'Aventureiro',  50),
  (3, 'Veterano',    150),
  (4, 'Mestre',      300);

-- -----------------------------------------------------------------------------
-- Perfil público
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio          text check (char_length(bio) <= 280),
  avatar_url   text,
  interests    public.game_type[] not null default '{}',
  -- Dias da semana disponíveis: 0 = domingo ... 6 = sábado.
  availability smallint[] not null default '{}'
               check (availability <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  role         public.app_role not null default 'user',
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Dados sensíveis (LGPD): só o próprio dono lê. Nunca aparecem para outros.
-- -----------------------------------------------------------------------------
create table public.private_profiles (
  user_id           uuid primary key references public.profiles on delete cascade,
  cpf               text not null unique check (public.is_valid_cpf(cpf)),
  birth_date        date not null,
  phone             text check (phone ~ '^[0-9]{10,11}$'),
  -- Registro do aceite dos termos/LGPD no cadastro.
  terms_accepted_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Estatísticas de reputação: escritas SÓ pelas funções do banco.
-- -----------------------------------------------------------------------------
create table public.player_stats (
  user_id         uuid primary key references public.profiles on delete cascade,
  xp              int not null default 0 check (xp >= 0),
  level           smallint not null default 1 references public.levels,
  sessions_played int not null default 0,
  sessions_hosted int not null default 0,
  no_shows        int not null default 0,
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Locais (estabelecimentos). Só aparecem publicamente depois de verificados.
-- -----------------------------------------------------------------------------
create table public.venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 2 and 80),
  address      text not null,
  city         text not null default 'Curitiba',
  lat          double precision not null check (lat between -90 and 90),
  lng          double precision not null check (lng between -180 and 180),
  description  text,
  game_types   public.game_type[] not null default '{}',
  instagram    text,
  is_verified  boolean not null default false,
  suggested_by uuid references public.profiles on delete set null,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Missões (sessões de jogo)
-- -----------------------------------------------------------------------------
create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  host_id          uuid not null references public.profiles,
  venue_id         uuid references public.venues,
  title            text not null check (char_length(title) between 3 and 80),
  game_type        public.game_type not null,
  system_name      text check (char_length(system_name) <= 60),
  kind             public.session_kind not null default 'mesa',
  mode             public.session_mode not null,
  description      text check (char_length(description) <= 2000),
  starts_at        timestamptz not null,
  duration_minutes int not null default 180 check (duration_minutes between 30 and 1440),
  -- Vagas para jogadores; o mestre não ocupa vaga (DECISIONS.md).
  max_players      int not null check (max_players between 2 and 20),
  recurrence       public.recurrence_kind not null default 'none',
  min_level        smallint not null default 1 references public.levels,
  is_paid          boolean not null default false,
  price_cents      int check (price_cents >= 0),
  status           public.session_status not null default 'open',
  created_at       timestamptz not null default now(),

  -- Presencial exige local; online não tem local.
  constraint sessions_venue_matches_mode check (
    (mode = 'presencial' and venue_id is not null) or (mode = 'online' and venue_id is null)
  ),
  -- Valor só faz sentido em mesa paga.
  constraint sessions_price_only_if_paid check (is_paid or price_cents is null)
);

-- Links de contato: visíveis só para o mestre e para participantes aprovados.
create table public.session_contacts (
  session_id  uuid primary key references public.sessions on delete cascade,
  contact_url text check (contact_url ~ '^https://'),
  online_url  text check (online_url ~ '^https://')
);

create table public.session_participants (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  user_id    uuid not null references public.profiles on delete cascade,
  status     public.participant_status not null default 'pending',
  attended   boolean, -- preenchido ao concluir a missão
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Histórico de reputação: escrito SÓ pelas funções do banco.
-- -----------------------------------------------------------------------------
create table public.reputation_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  session_id uuid references public.sessions on delete set null,
  kind       public.reputation_kind not null,
  points     int not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Denúncias
-- -----------------------------------------------------------------------------
create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references public.profiles on delete cascade,
  target_user_id    uuid references public.profiles on delete cascade,
  target_session_id uuid references public.sessions on delete cascade,
  reason            text not null check (char_length(reason) between 3 and 60),
  details           text check (char_length(details) <= 1000),
  status            public.report_status not null default 'open',
  created_at        timestamptz not null default now(),
  check (target_user_id is not null or target_session_id is not null)
);

-- -----------------------------------------------------------------------------
-- Notificações dentro do app
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Índices para as consultas mais comuns
-- -----------------------------------------------------------------------------
create index sessions_starts_at_idx        on public.sessions (starts_at) where status = 'open';
create index sessions_host_idx             on public.sessions (host_id);
create index sessions_venue_idx            on public.sessions (venue_id);
create index participants_user_idx         on public.session_participants (user_id);
create index participants_session_idx      on public.session_participants (session_id, status);
create index reputation_events_user_idx    on public.reputation_events (user_id, created_at desc);
create index reports_target_user_open_idx  on public.reports (target_user_id) where status = 'open';
create index notifications_user_idx        on public.notifications (user_id, created_at desc);
create index venues_verified_idx           on public.venues (is_verified);
