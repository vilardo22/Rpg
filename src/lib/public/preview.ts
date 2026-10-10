import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameType, SessionKind, SessionMode } from "@/lib/missions/labels";

/**
 * Prévia da home pública (RF-09): próximas missões e locais para quem ainda não
 * entrou. O RLS não deixa visitantes lerem nada, então esta consulta usa a chave
 * secreta NO SERVIDOR e escolhe só colunas públicas: nada de contato, participantes,
 * mestre ou dados de perfil. O resultado vai direto para o HTML da página.
 */

export type PreviewMission = {
  id: string;
  title: string;
  game_type: GameType;
  kind: SessionKind;
  mode: SessionMode;
  starts_at: string;
  venue: { name: string } | null;
};

export type PreviewVenue = { id: string; name: string; game_types: GameType[] };

export async function getPublicPreview(): Promise<{ missions: PreviewMission[]; venues: PreviewVenue[] }> {
  // A prévia é um extra: se o banco ou a chave falharem, a home abre sem ela.
  try {
    return await fetchPreview();
  } catch {
    return { missions: [], venues: [] };
  }
}

async function fetchPreview() {
  const admin = createAdminClient();
  const [missions, venues] = await Promise.all([
    admin
      .from("sessions")
      .select("id, title, game_type, kind, mode, starts_at, venue:venues ( name )")
      .eq("status", "open")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(4),
    admin.from("venues").select("id, name, game_types").eq("is_verified", true).order("name").limit(6),
  ]);
  return {
    missions: (missions.data ?? []) as unknown as PreviewMission[],
    venues: (venues.data ?? []) as PreviewVenue[],
  };
}
