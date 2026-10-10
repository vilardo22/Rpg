-- =============================================================================
-- Quadro de Missões — 2/3: gatilhos e funções (RPC)
--
-- Toda regra que mexe em reputação, vagas ou permissões roda AQUI, no banco.
-- As funções são `security definer` (rodam com permissão do dono, ignorando RLS)
-- e por isso cada uma confere, logo no início, se quem chamou tem direito.
-- `set search_path = ''` obriga a escrever public.tabela, evitando sequestro de nomes.
-- Mensagens de erro em português: o app mostra o texto direto para o usuário.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auxiliares de permissão (usadas também pelas políticas RLS)
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_session_host(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sessions where id = p_session_id and host_id = auth.uid()
  );
$$;

create or replace function public.is_approved_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.session_participants
    where session_id = p_session_id and user_id = auth.uid() and status = 'approved'
  );
$$;

-- Selo "Em análise" (RF-06): 3 ou mais denúncias abertas, de pessoas diferentes.
-- Devolve só o booleano: quem chama não vê as denúncias em si.
create or replace function public.is_under_review(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct reporter_id) >= 3
  from public.reports
  where target_user_id = p_user_id and status = 'open';
$$;

-- Nível correspondente a um total de XP (consulta a tabela levels).
create or replace function public.level_for_xp(p_xp int)
returns smallint
language sql
stable
set search_path = ''
as $$
  select coalesce(max(level), 1)::smallint from public.levels where min_xp <= p_xp;
$$;

-- Hoje no fuso de Curitiba (para a regra de 18+).
create or replace function public.today_sp()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Cria uma notificação in-app. Uso interno das outras funções.
create or replace function public.notify(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
$$;

-- Aplica um evento de reputação: grava o histórico e atualiza XP e nível.
-- Os pontos vêm da tabela reputation_rules. O XP nunca fica abaixo de 0.
create or replace function public.apply_reputation(
  p_user_id uuid, p_kind public.reputation_kind, p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_points int;
begin
  select points into strict v_points from public.reputation_rules where kind = p_kind;

  insert into public.reputation_events (user_id, session_id, kind, points)
  values (p_user_id, p_session_id, p_kind, v_points);

  update public.player_stats
  set xp              = greatest(0, xp + v_points),
      level           = public.level_for_xp(greatest(0, xp + v_points)),
      sessions_played = sessions_played + case when p_kind in ('played', 'tournament') then 1 else 0 end,
      sessions_hosted = sessions_hosted + case when p_kind = 'hosted' then 1 else 0 end,
      no_shows        = no_shows + case when p_kind = 'no_show' then 1 else 0 end,
      updated_at      = now()
  where user_id = p_user_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Gatilhos
-- -----------------------------------------------------------------------------

-- Novo usuário no Supabase Auth → cria o perfil público e as estatísticas zeradas.
-- O nome de exibição vem dos metadados enviados no cadastro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  insert into public.player_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Idade mínima de 18 anos, conferida também no banco (RF-01).
create or replace function public.check_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date > (public.today_sp() - interval '18 years')::date then
    raise exception 'É preciso ter 18 anos ou mais para usar o Quadro de Missões.';
  end if;
  return new;
end;
$$;

create trigger private_profiles_check_adult
  before insert or update of birth_date on public.private_profiles
  for each row execute function public.check_adult();

-- Missão presencial só em local verificado; missão nova só com data futura.
create or replace function public.check_session_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.mode = 'presencial' and not exists (
    select 1 from public.venues where id = new.venue_id and is_verified
  ) then
    raise exception 'Missões presenciais só podem acontecer em locais verificados.';
  end if;

  -- Só vale para quem usa o app; o seed (chave secreta) pode criar missões passadas.
  if tg_op = 'INSERT' and auth.role() = 'authenticated' and new.starts_at <= now() then
    raise exception 'A data da missão precisa estar no futuro.';
  end if;

  return new;
end;
$$;

create trigger sessions_check_rules
  before insert or update of mode, venue_id, starts_at on public.sessions
  for each row execute function public.check_session_rules();

-- -----------------------------------------------------------------------------
-- RPC: missões
-- -----------------------------------------------------------------------------

-- Jogador pede para entrar numa missão. Fica "pending" até o mestre responder.
-- Devolve {"below_min_level": true} quando o nível do jogador é menor que o
-- recomendado: é só um aviso, o pedido é criado mesmo assim (DECISIONS.md).
create or replace function public.request_join(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.sessions;
  v_existing public.participant_status;
  v_level smallint;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para pedir uma vaga.';
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    raise exception 'Missão não encontrada.';
  end if;
  if v_session.host_id = v_uid then
    raise exception 'Você é o mestre desta missão.';
  end if;
  if v_session.status <> 'open' or v_session.starts_at <= now() then
    raise exception 'Esta missão não está mais aceitando pedidos.';
  end if;

  select status into v_existing
  from public.session_participants
  where session_id = p_session_id and user_id = v_uid;

  if v_existing in ('pending', 'approved') then
    raise exception 'Você já pediu para entrar nesta missão.';
  elsif v_existing = 'rejected' then
    raise exception 'O mestre recusou seu pedido para esta missão.';
  elsif v_existing = 'cancelled' then
    -- Quem cancelou pode pedir de novo.
    update public.session_participants
    set status = 'pending', created_at = now()
    where session_id = p_session_id and user_id = v_uid;
  else
    insert into public.session_participants (session_id, user_id) values (p_session_id, v_uid);
  end if;

  select display_name into v_name from public.profiles where id = v_uid;
  perform public.notify(
    v_session.host_id, 'join_requested', 'Novo pedido de entrada',
    v_name || ' quer entrar em "' || v_session.title || '".',
    '/missoes/' || p_session_id
  );

  select level into v_level from public.player_stats where user_id = v_uid;
  return jsonb_build_object('below_min_level', coalesce(v_level, 1) < v_session.min_level);
end;
$$;

-- Mestre aprova ou recusa um pedido. Recusar um jogador já aprovado o remove da mesa.
create or replace function public.respond_join(p_session_id uuid, p_user_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions;
  v_status public.participant_status;
  v_approved int;
begin
  -- "for update" trava a missão: dois "aprovar" simultâneos não estouram as vagas.
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.host_id is distinct from auth.uid() then
    raise exception 'Só o mestre da missão pode responder aos pedidos.';
  end if;
  if v_session.status <> 'open' then
    raise exception 'Esta missão já foi encerrada.';
  end if;

  select status into v_status
  from public.session_participants
  where session_id = p_session_id and user_id = p_user_id;

  if p_approve then
    if v_status is distinct from 'pending' then
      raise exception 'Este pedido não está mais pendente.';
    end if;

    select count(*) into v_approved
    from public.session_participants
    where session_id = p_session_id and status = 'approved';
    if v_approved >= v_session.max_players then
      raise exception 'A missão já está com todas as vagas preenchidas.';
    end if;

    update public.session_participants set status = 'approved'
    where session_id = p_session_id and user_id = p_user_id;

    perform public.notify(
      p_user_id, 'join_approved', 'Pedido aprovado!',
      'Você está em "' || v_session.title || '". O contato do grupo já está liberado.',
      '/missoes/' || p_session_id
    );
  else
    if v_status is null or v_status not in ('pending', 'approved') then
      raise exception 'Este pedido não está mais ativo.';
    end if;

    update public.session_participants set status = 'rejected'
    where session_id = p_session_id and user_id = p_user_id;

    perform public.notify(
      p_user_id, 'join_rejected', 'Pedido não aprovado',
      'O mestre não aprovou sua entrada em "' || v_session.title || '".',
      '/missoes/' || p_session_id
    );
  end if;
end;
$$;

-- Participante desiste da missão. Cancelar antes da conclusão não gera penalidade.
create or replace function public.cancel_participation(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.sessions;
  v_status public.participant_status;
  v_name text;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found or v_session.status <> 'open' then
    raise exception 'Esta missão já foi encerrada.';
  end if;

  select status into v_status
  from public.session_participants
  where session_id = p_session_id and user_id = v_uid;
  if v_status is null or v_status not in ('pending', 'approved') then
    raise exception 'Você não está participando desta missão.';
  end if;

  update public.session_participants set status = 'cancelled'
  where session_id = p_session_id and user_id = v_uid;

  if v_status = 'approved' then
    select display_name into v_name from public.profiles where id = v_uid;
    perform public.notify(
      v_session.host_id, 'participant_cancelled', 'Uma vaga foi liberada',
      v_name || ' saiu de "' || v_session.title || '".',
      '/missoes/' || p_session_id
    );
  end if;
end;
$$;

-- Mestre cancela a missão inteira e avisa quem estava aprovado ou aguardando.
create or replace function public.cancel_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions;
  v_user uuid;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.host_id is distinct from auth.uid() then
    raise exception 'Só o mestre pode cancelar a missão.';
  end if;
  if v_session.status <> 'open' then
    raise exception 'Esta missão já foi encerrada.';
  end if;

  update public.sessions set status = 'cancelled' where id = p_session_id;

  for v_user in
    select user_id from public.session_participants
    where session_id = p_session_id and status in ('pending', 'approved')
  loop
    perform public.notify(
      v_user, 'session_cancelled', 'Missão cancelada',
      'O mestre cancelou "' || v_session.title || '".',
      '/missoes/' || p_session_id
    );
  end loop;
end;
$$;

-- Mestre conclui a missão marcando quem compareceu. Dispara o ranking (RF-05):
--   presente → +10 (ou +20 em torneio) · ausente → −15 · mestre → +15
-- Só pode ser chamada depois do horário de início (evita "farmar" XP).
create or replace function public.complete_session(p_session_id uuid, p_attended_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions;
  v_attended uuid[] := coalesce(p_attended_user_ids, '{}');
  v_participant record;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.host_id is distinct from auth.uid() then
    raise exception 'Só o mestre pode concluir a missão.';
  end if;
  if v_session.status <> 'open' then
    raise exception 'Esta missão já foi encerrada.';
  end if;
  if v_session.starts_at > now() then
    raise exception 'A missão só pode ser concluída depois do horário de início.';
  end if;

  -- Toda presença marcada precisa ser de um participante aprovado.
  if exists (
    select 1 from unnest(v_attended) as a(user_id)
    where not exists (
      select 1 from public.session_participants p
      where p.session_id = p_session_id and p.user_id = a.user_id and p.status = 'approved'
    )
  ) then
    raise exception 'A lista de presença tem alguém que não é participante aprovado.';
  end if;

  for v_participant in
    select user_id from public.session_participants
    where session_id = p_session_id and status = 'approved'
  loop
    if v_participant.user_id = any (v_attended) then
      update public.session_participants set attended = true
      where session_id = p_session_id and user_id = v_participant.user_id;
      perform public.apply_reputation(
        v_participant.user_id,
        case when v_session.kind = 'torneio' then 'tournament' else 'played' end::public.reputation_kind,
        p_session_id
      );
    else
      update public.session_participants set attended = false
      where session_id = p_session_id and user_id = v_participant.user_id;
      perform public.apply_reputation(v_participant.user_id, 'no_show', p_session_id);
    end if;

    perform public.notify(
      v_participant.user_id, 'session_completed', 'Missão concluída',
      '"' || v_session.title || '" foi concluída. Confira seu XP no perfil.',
      '/perfil/' || v_participant.user_id
    );
  end loop;

  perform public.apply_reputation(v_session.host_id, 'hosted', p_session_id);

  -- Pedidos que ficaram sem resposta não fazem mais sentido.
  update public.session_participants set status = 'rejected'
  where session_id = p_session_id and status = 'pending';

  update public.sessions set status = 'completed' where id = p_session_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: denúncias e administração
-- -----------------------------------------------------------------------------

-- Denuncia um perfil ou uma missão. Uma pessoa não pode ter duas denúncias
-- abertas contra o mesmo alvo (evita forçar o selo "Em análise" sozinha).
create or replace function public.submit_report(
  p_target_user_id uuid, p_target_session_id uuid, p_reason text, p_details text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para denunciar.';
  end if;
  if p_target_user_id is null and p_target_session_id is null then
    raise exception 'Informe quem ou qual missão você está denunciando.';
  end if;
  if p_target_user_id = v_uid then
    raise exception 'Você não pode denunciar a si mesmo.';
  end if;
  if exists (
    select 1 from public.reports
    where reporter_id = v_uid and status = 'open'
      and target_user_id is not distinct from p_target_user_id
      and target_session_id is not distinct from p_target_session_id
  ) then
    raise exception 'Você já tem uma denúncia aberta sobre isso. Aguarde a análise.';
  end if;

  insert into public.reports (reporter_id, target_user_id, target_session_id, reason, details)
  values (v_uid, p_target_user_id, p_target_session_id, p_reason, nullif(trim(p_details), ''))
  returning id into v_id;

  return v_id;
end;
$$;

-- Admin confirma (−30 XP) ou descarta uma denúncia. Denúncia confirmada contra
-- uma missão penaliza o mestre dela.
create or replace function public.review_report(p_report_id uuid, p_confirm boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.reports;
  v_target uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem revisar denúncias.';
  end if;

  select * into v_report from public.reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'Esta denúncia já foi revisada.';
  end if;

  update public.reports
  set status = case when p_confirm then 'confirmed' else 'dismissed' end::public.report_status
  where id = p_report_id;

  if p_confirm then
    v_target := coalesce(
      v_report.target_user_id,
      (select host_id from public.sessions where id = v_report.target_session_id)
    );
    perform public.apply_reputation(v_target, 'report_confirmed', v_report.target_session_id);
  end if;
end;
$$;

-- Admin aprova um local (passa a aparecer no mapa) ou o rejeita. Rejeitar um
-- local que já tem missões só o esconde; sem missões, ele é apagado.
create or replace function public.approve_venue(p_venue_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar locais.';
  end if;

  if p_approve then
    update public.venues set is_verified = true where id = p_venue_id;
  elsif exists (select 1 from public.sessions where venue_id = p_venue_id) then
    update public.venues set is_verified = false where id = p_venue_id;
  else
    delete from public.venues where id = p_venue_id;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Quem pode chamar o quê.
-- Por padrão o Postgres deixa qualquer um (inclusive anônimos) executar funções.
-- Tiramos isso e liberamos só as RPCs públicas, só para usuários logados.
-- As funções internas (notify, apply_reputation...) ficam inacessíveis pela API.
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_admin(),
  public.is_session_host(uuid),
  public.is_approved_participant(uuid),
  public.is_under_review(uuid),
  public.level_for_xp(int),
  public.is_valid_cpf(text),
  public.today_sp(),
  public.request_join(uuid),
  public.respond_join(uuid, uuid, boolean),
  public.cancel_participation(uuid),
  public.cancel_session(uuid),
  public.complete_session(uuid, uuid[]),
  public.submit_report(uuid, uuid, text, text),
  public.review_report(uuid, boolean),
  public.approve_venue(uuid, boolean)
to authenticated;
