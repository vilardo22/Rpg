"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Ações do painel admin. requireAdmin barra quem não é admin já aqui, e as funções
 * do banco (review_report, approve_venue) conferem de novo com is_admin().
 */

type Result = { error?: string };

async function callAdminRpc(fn: string, args: Record<string, unknown>): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.code === "P0001" ? error.message : "Não foi possível concluir agora." };
  revalidatePath("/admin");
  return {};
}

/** Confirmar aplica −30 XP a quem foi denunciado (ou ao mestre, se a denúncia for de missão). */
export async function reviewReport(reportId: string, confirm: boolean) {
  const result = await callAdminRpc("review_report", { p_report_id: reportId, p_confirm: confirm });
  if (!result.error) revalidatePath("/perfil", "layout");
  return result;
}

/** Aprovar coloca o local no mapa; rejeitar apaga (ou só esconde, se já tiver missões). */
export async function approveVenue(venueId: string, approve: boolean) {
  const result = await callAdminRpc("approve_venue", { p_venue_id: venueId, p_approve: approve });
  if (!result.error) {
    revalidatePath("/locais");
    revalidatePath("/missoes/nova");
  }
  return result;
}
