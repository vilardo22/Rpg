import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { GameType } from "@/lib/missions/labels";

/**
 * Consultas de locais (RF-04). O RLS já esconde locais não verificados de quem não
 * os sugeriu; mesmo assim a lista e o mapa filtram `is_verified = true` explicitamente,
 * para que nem o admin veja locais pendentes misturados aos públicos.
 */

export type UpcomingMission = { id: string; title: string; starts_at: string };

export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  description: string | null;
  game_types: GameType[];
  instagram: string | null;
  is_verified: boolean;
  /** Próximas missões abertas no local, da mais próxima para a mais distante. */
  upcoming: UpcomingMission[];
};

const COLUMNS = `
  id, name, address, city, lat, lng, description, game_types, instagram, is_verified,
  upcoming:sessions ( id, title, starts_at )`;

/** Locais verificados com as próximas missões de cada um (para o mapa e a lista). */
export async function listVenues(): Promise<Venue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(COLUMNS)
    .eq("is_verified", true)
    // Filtros e ordem aplicados às missões embutidas (não aos locais).
    .eq("upcoming.status", "open")
    .gt("upcoming.starts_at", new Date().toISOString())
    .order("starts_at", { referencedTable: "upcoming", ascending: true })
    .order("name");
  if (error) throw new Error(`Erro ao listar locais: ${error.message}`);
  return data as unknown as Venue[];
}

/** Um local pelo id (o RLS devolve null se for pendente e não for meu nem eu for admin). */
export const getVenue = cache(async (id: string): Promise<Venue | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(COLUMNS)
    .eq("id", id)
    .eq("upcoming.status", "open")
    .gt("upcoming.starts_at", new Date().toISOString())
    .order("starts_at", { referencedTable: "upcoming", ascending: true })
    .maybeSingle();
  if (error) throw new Error(`Erro ao carregar o local: ${error.message}`);
  return data as unknown as Venue | null;
});
