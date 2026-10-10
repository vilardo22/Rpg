import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toSaoPauloIso } from "@/lib/format";
import { PAGE_SIZE, type MissionFilters } from "./filters";
import type {
  GameType,
  ParticipantStatus,
  Recurrence,
  SessionKind,
  SessionMode,
  SessionStatus,
} from "./labels";

/**
 * Consultas de missões. Todas usam o cliente do usuário logado, então o RLS decide
 * o que volta: participantes pendentes só aparecem para o mestre e para o próprio
 * jogador, e o link de contato só vem para o mestre e os aprovados.
 */

export type MissionSummary = {
  id: string;
  title: string;
  game_type: GameType;
  system_name: string | null;
  kind: SessionKind;
  mode: SessionMode;
  starts_at: string;
  duration_minutes: number;
  max_players: number;
  min_level: number;
  is_paid: boolean;
  price_cents: number | null;
  recurrence: Recurrence;
  status: SessionStatus;
  venue: { id: string; name: string } | null;
  host: { id: string; display_name: string; player_stats: { level: number } | null };
  approvedCount: number;
};

export type Participant = {
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
  profile: {
    display_name: string;
    player_stats: { level: number; sessions_played: number; no_shows: number } | null;
  };
};

export type MissionDetail = MissionSummary & {
  description: string | null;
  venue: { id: string; name: string; address: string } | null;
  contacts: { contact_url: string | null; online_url: string | null } | null;
  participants: Participant[];
};

/** Colunas comuns à lista e ao detalhe. `host:profiles!host_id` = o perfil do mestre. */
const SUMMARY_COLUMNS = `
  id, title, game_type, system_name, kind, mode, starts_at, duration_minutes, max_players,
  min_level, is_paid, price_cents, recurrence, status,
  host:profiles!host_id ( id, display_name, player_stats ( level ) )`;

type RowWithStatuses = { participants: { status: ParticipantStatus }[] };

function countApproved(participants: { status: ParticipantStatus }[]): number {
  return participants.filter((p) => p.status === "approved").length;
}

/** Lista paginada com filtros (RF-03), da mais próxima para a mais distante. */
export async function listMissions(filters: MissionFilters, userId: string) {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;

  let query = supabase
    .from("sessions")
    .select(`${SUMMARY_COLUMNS}, venue:venues ( id, name ), participants:session_participants ( status )`, {
      count: "exact",
    })
    .eq("status", "open")
    .order("starts_at", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.tab === "minhas") {
    // Minhas = que eu organizo ou em que pedi/tenho vaga. Inclui as que já começaram
    // (até 1 dia atrás), para o mestre conseguir abrir e concluir.
    const ids = await myMissionIds(userId);
    if (ids.length === 0) return { missions: [] as MissionSummary[], total: 0 };
    query = query.in("id", ids).gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  } else {
    query = query.gt("starts_at", new Date().toISOString());
  }

  if (filters.gameType) query = query.eq("game_type", filters.gameType);
  if (filters.mode) query = query.eq("mode", filters.mode);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.venueId) query = query.eq("venue_id", filters.venueId);
  if (filters.level) query = query.lte("min_level", filters.level);
  if (filters.date) {
    // O dia inteiro em Curitiba: de 00:00 até 23:59.
    query = query
      .gte("starts_at", toSaoPauloIso(filters.date, "00:00"))
      .lte("starts_at", toSaoPauloIso(filters.date, "23:59"));
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`Erro ao listar missões: ${error.message}`);

  const missions = (data as unknown as (Omit<MissionSummary, "approvedCount"> & RowWithStatuses)[]).map(
    ({ participants, ...mission }) => ({ ...mission, approvedCount: countApproved(participants) }),
  );
  return { missions, total: count ?? 0 };
}

/** Ids das missões que eu organizo ou em que estou (pendente ou aprovado). */
async function myMissionIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const [hosted, joined] = await Promise.all([
    supabase.from("sessions").select("id").eq("host_id", userId),
    supabase
      .from("session_participants")
      .select("session_id")
      .eq("user_id", userId)
      .in("status", ["pending", "approved"]),
  ]);
  return [
    ...(hosted.data ?? []).map((s) => s.id as string),
    ...(joined.data ?? []).map((p) => p.session_id as string),
  ];
}

/**
 * Detalhe completo de uma missão, ou null se não existir.
 * `cache`: o título da aba (generateMetadata) e a página usam a mesma consulta.
 */
export const getMission = cache(async (id: string): Promise<MissionDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `${SUMMARY_COLUMNS}, description,
       venue:venues ( id, name, address ),
       contacts:session_contacts ( contact_url, online_url ),
       participants:session_participants (
         user_id, status, created_at,
         profile:profiles ( display_name, player_stats ( level, sessions_played, no_shows ) )
       )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao carregar a missão: ${error.message}`);
  if (!data) return null;

  const mission = data as unknown as Omit<MissionDetail, "approvedCount">;
  return { ...mission, approvedCount: countApproved(mission.participants) };
});

/** Quais destes usuários têm o selo "Em análise" (3+ denúncias abertas, RF-06). */
export async function underReviewUsers(userIds: string[]): Promise<Set<string>> {
  const supabase = await createClient();
  const results = await Promise.all(
    userIds.map(async (id) => {
      const { data } = await supabase.rpc("is_under_review", { p_user_id: id });
      return data === true ? id : null;
    }),
  );
  return new Set(results.filter((id): id is string => id !== null));
}

/** Locais verificados, para o filtro e para o formulário de missão presencial. */
export async function listVerifiedVenues() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_verified", true)
    .order("name");
  if (error) throw new Error(`Erro ao listar locais: ${error.message}`);
  return data as { id: string; name: string }[];
}

/** Nível atual do usuário logado (para avisar quando a missão recomenda nível maior). */
export async function getMyLevel(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("player_stats").select("level").eq("user_id", userId).maybeSingle();
  return (data?.level as number | undefined) ?? 1;
}
