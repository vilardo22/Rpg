-- =============================================================================
-- Quadro de Missões — 3/3: segurança (RLS e permissões por coluna)
--
-- Duas camadas:
--   1. Permissões (GRANT): quais tabelas/colunas cada papel pode tocar.
--      Ex.: o usuário pode editar o próprio perfil, mas NÃO a coluna "role".
--   2. Políticas RLS: quais LINHAS cada usuário vê ou altera.
-- O papel "anon" (visitante sem login) não acessa nenhuma tabela.
-- Escritas sensíveis (vagas, XP, denúncias) só acontecem pelas funções da etapa 2/3.
-- =============================================================================

-- Liga RLS em todas as tabelas. Sem política = ninguém acessa (exceto a chave secreta).
alter table public.reputation_rules     enable row level security;
alter table public.levels               enable row level security;
alter table public.profiles             enable row level security;
alter table public.private_profiles     enable row level security;
alter table public.player_stats         enable row level security;
alter table public.venues               enable row level security;
alter table public.sessions             enable row level security;
alter table public.session_contacts     enable row level security;
alter table public.session_participants enable row level security;
alter table public.reputation_events    enable row level security;
alter table public.reports              enable row level security;
alter table public.notifications        enable row level security;

-- -----------------------------------------------------------------------------
-- Camada 1: permissões. Começa do zero e libera só o necessário.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.reputation_rules, public.levels, public.profiles, public.private_profiles,
  public.player_stats, public.venues, public.sessions, public.session_contacts,
  public.session_participants, public.reputation_events, public.reports, public.notifications
to authenticated;

-- Perfil: só os campos editáveis (nunca id, role ou created_at).
grant update (display_name, bio, avatar_url, interests, availability)
  on public.profiles to authenticated;

-- Dados privados: o CPF e a data de nascimento não mudam depois do cadastro.
grant insert (user_id, cpf, birth_date, phone) on public.private_profiles to authenticated;
grant update (phone) on public.private_profiles to authenticated;

-- Sugerir local (nasce não verificado, ver política abaixo).
grant insert (name, address, city, lat, lng, description, game_types, instagram, is_verified, suggested_by)
  on public.venues to authenticated;
grant update on public.venues to authenticated; -- a política restringe a admins

-- Missões: o status só muda pelas funções (cancel_session, complete_session).
grant insert (host_id, venue_id, title, game_type, system_name, kind, mode, description,
              starts_at, duration_minutes, max_players, recurrence, min_level, is_paid, price_cents)
  on public.sessions to authenticated;
grant update (venue_id, title, game_type, system_name, kind, mode, description,
              starts_at, duration_minutes, max_players, recurrence, min_level, is_paid, price_cents)
  on public.sessions to authenticated;
grant delete on public.sessions to authenticated;

grant insert (session_id, contact_url, online_url), update (contact_url, online_url)
  on public.session_contacts to authenticated;

-- Notificações: o usuário só pode marcar como lida ou apagar.
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- Camada 2: políticas RLS (linhas)
-- -----------------------------------------------------------------------------

-- Configuração de reputação: leitura para logados (a tela mostra nomes de nível).
create policy "logados leem regras de reputação" on public.reputation_rules
  for select to authenticated using (true);
create policy "logados leem níveis" on public.levels
  for select to authenticated using (true);

-- Perfis: qualquer logado lê; cada um edita só o seu.
create policy "logados leem perfis" on public.profiles
  for select to authenticated using (true);
create policy "usuário edita o próprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Dados privados (CPF, nascimento, telefone): SÓ o dono.
create policy "dono lê os próprios dados privados" on public.private_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "dono cria os próprios dados privados" on public.private_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "dono edita os próprios dados privados" on public.private_profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Estatísticas e histórico de reputação: leitura para logados, escrita só pelas funções.
create policy "logados leem estatísticas" on public.player_stats
  for select to authenticated using (true);
create policy "logados leem histórico de reputação" on public.reputation_events
  for select to authenticated using (true);

-- Locais: verificados para todos; pendentes só para quem sugeriu e para admins.
create policy "logados leem locais verificados ou próprios" on public.venues
  for select to authenticated
  using (is_verified or suggested_by = (select auth.uid()) or (select public.is_admin()));
create policy "logado sugere local não verificado" on public.venues
  for insert to authenticated
  with check (suggested_by = (select auth.uid()) and not is_verified);
create policy "admin edita locais" on public.venues
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Missões: logados leem; cada mestre mexe só nas suas.
create policy "logados leem missões" on public.sessions
  for select to authenticated using (true);
create policy "mestre cria missão em seu nome" on public.sessions
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "mestre edita missão aberta" on public.sessions
  for update to authenticated
  using (host_id = (select auth.uid()) and status = 'open')
  with check (host_id = (select auth.uid()));
create policy "mestre apaga missão não concluída" on public.sessions
  for delete to authenticated
  using (host_id = (select auth.uid()) and status <> 'completed');

-- Contatos: só o mestre e os participantes aprovados (RF-03/RF-06).
create policy "mestre e aprovados leem contatos" on public.session_contacts
  for select to authenticated
  using (public.is_session_host(session_id) or public.is_approved_participant(session_id));
create policy "mestre cria contatos" on public.session_contacts
  for insert to authenticated with check (public.is_session_host(session_id));
create policy "mestre edita contatos" on public.session_contacts
  for update to authenticated
  using (public.is_session_host(session_id))
  with check (public.is_session_host(session_id));

-- Participantes: aprovados aparecem para todos (detalhe da missão); pedidos
-- pendentes/recusados só para o próprio jogador e para o mestre. Escrita só via RPC.
create policy "participantes visíveis conforme o papel" on public.session_participants
  for select to authenticated
  using (
    status = 'approved'
    or user_id = (select auth.uid())
    or public.is_session_host(session_id)
  );

-- Denúncias: o autor vê as suas; o admin vê todas. Escrita só via RPC.
create policy "autor e admin leem denúncias" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

-- Notificações: cada um só as suas.
create policy "dono lê notificações" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "dono marca notificação como lida" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono apaga notificação" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));
