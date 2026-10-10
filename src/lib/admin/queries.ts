import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GameType } from "@/lib/missions/labels";

/**
 * Consultas do painel admin (RF-08). Rodam com o login do admin: é o RLS que
 * libera para ele os locais pendentes e todas as denúncias (is_admin()).
 * Quem chama estas funções já passou por requireAdmin().
 */

type ProfileRef = { id: string; display_name: string };

export type PendingVenue = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  game_types: GameType[];
  created_at: string;
  suggester: ProfileRef | null;
};

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: "open" | "confirmed" | "dismissed";
  created_at: string;
  reporter: ProfileRef;
  target_user: ProfileRef | null;
  target_session: { id: string; title: string; host: ProfileRef } | null;
};

export type AdminUser = {
  id: string;
  display_name: string;
  role: "user" | "admin";
  created_at: string;
  stats: { xp: number; level: number; sessions_played: number; no_shows: number } | null;
  openReports: number;
};

export async function listPendingVenues(): Promise<PendingVenue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, lat, lng, description, game_types, created_at, suggester:profiles!suggested_by ( id, display_name )")
    .eq("is_verified", false)
    .order("created_at");
  if (error) throw new Error(`Erro ao listar locais pendentes: ${error.message}`);
  return data as unknown as PendingVenue[];
}

const REPORT_COLUMNS = `
  id, reason, details, status, created_at,
  reporter:profiles!reporter_id ( id, display_name ),
  target_user:profiles!target_user_id ( id, display_name ),
  target_session:sessions ( id, title, host:profiles!host_id ( id, display_name ) )`;

/** Denúncias abertas (mais antigas primeiro) e as 10 últimas já revisadas. */
export async function listReports(): Promise<{ open: AdminReport[]; reviewed: AdminReport[] }> {
  const supabase = await createClient();
  const [open, reviewed] = await Promise.all([
    supabase.from("reports").select(REPORT_COLUMNS).eq("status", "open").order("created_at"),
    supabase.from("reports").select(REPORT_COLUMNS).neq("status", "open").order("created_at", { ascending: false }).limit(10),
  ]);
  if (open.error) throw new Error(`Erro ao listar denúncias: ${open.error.message}`);
  return {
    open: open.data as unknown as AdminReport[],
    reviewed: (reviewed.data ?? []) as unknown as AdminReport[],
  };
}

/** Usuários (somente leitura), mais recentes primeiro, com as denúncias abertas de cada um. */
export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const [users, reports] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, created_at, stats:player_stats ( xp, level, sessions_played, no_shows )")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("reports").select("target_user_id").eq("status", "open").not("target_user_id", "is", null),
  ]);
  if (users.error) throw new Error(`Erro ao listar usuários: ${users.error.message}`);

  const openByUser = new Map<string, number>();
  for (const r of reports.data ?? []) {
    const id = r.target_user_id as string;
    openByUser.set(id, (openByUser.get(id) ?? 0) + 1);
  }
  return (users.data as unknown as Omit<AdminUser, "openReports">[]).map((u) => ({
    ...u,
    openReports: openByUser.get(u.id) ?? 0,
  }));
}
