import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { GameType, SessionKind } from "@/lib/missions/labels";
import type { LevelRow } from "./levels";

/**
 * Perfil público (RF-02). Só lê tabelas públicas (profiles, player_stats,
 * reputation_events): CPF, nascimento e telefone ficam em private_profiles,
 * que nunca é consultada aqui e que o RLS só libera para o próprio dono.
 */

export type ReputationKind = "played" | "hosted" | "tournament" | "no_show" | "report_confirmed";

export type HistoryItem = {
  id: string;
  kind: ReputationKind;
  points: number;
  created_at: string;
  session: { id: string; title: string; starts_at: string; kind: SessionKind } | null;
};

export type PublicProfile = {
  id: string;
  display_name: string;
  bio: string | null;
  interests: GameType[];
  availability: number[];
  created_at: string;
  stats: { xp: number; level: number; sessions_played: number; sessions_hosted: number; no_shows: number };
  tournaments: number;
  history: HistoryItem[];
};

export const getProfile = cache(async (id: string): Promise<PublicProfile | null> => {
  const supabase = await createClient();
  const [profile, history, tournaments] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, bio, interests, availability, created_at, stats:player_stats ( xp, level, sessions_played, sessions_hosted, no_shows )",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("reputation_events")
      .select("id, kind, points, created_at, session:sessions ( id, title, starts_at, kind )")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    // Só a contagem, sem trazer as linhas (head: true).
    supabase
      .from("reputation_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("kind", "tournament"),
  ]);
  if (profile.error) throw new Error(`Erro ao carregar o perfil: ${profile.error.message}`);
  if (!profile.data) return null;

  const data = profile.data as unknown as Omit<PublicProfile, "history" | "tournaments">;
  return {
    ...data,
    stats: data.stats ?? { xp: 0, level: 1, sessions_played: 0, sessions_hosted: 0, no_shows: 0 },
    tournaments: tournaments.count ?? 0,
    history: (history.data ?? []) as unknown as HistoryItem[],
  };
});

/** Faixas de XP dos níveis (tabela levels), para a barra de progresso. */
export const getLevels = cache(async (): Promise<LevelRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("levels").select("level, name, min_xp").order("min_xp");
  if (error) throw new Error(`Erro ao carregar os níveis: ${error.message}`);
  return data as LevelRow[];
});
