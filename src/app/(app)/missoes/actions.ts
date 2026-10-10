"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsOf, type FormResult } from "@/lib/validation/errors";
import { missionSchema, toMissionRows, type MissionInput } from "@/lib/validation/mission";

/**
 * Ações das missões. As regras (vagas, quem pode aprovar, etc.) estão nas funções
 * do banco; aqui só chamamos a RPC e devolvemos a mensagem de erro, que o banco
 * já escreve em português.
 */

export type ActionResult = { error?: string; warning?: string };

const GENERIC_ERROR = "Não foi possível concluir agora. Tente de novo em instantes.";

export async function createMission(input: MissionInput): Promise<FormResult> {
  const user = await requireUser();
  const parsed = missionSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const { session, contacts } = toMissionRows(parsed.data, user.id);
  const supabase = await createClient();

  const { data, error } = await supabase.from("sessions").insert(session).select("id").single();
  if (error || !data) {
    // P0001 = erro lançado pelas nossas funções (ex.: local não verificado), já em português.
    return { error: error?.code === "P0001" ? error.message : GENERIC_ERROR };
  }

  const { error: contactError } = await supabase
    .from("session_contacts")
    .insert({ session_id: data.id, ...contacts });
  if (contactError) {
    // Sem contato a missão não serve: desfaz para não deixar missão pela metade.
    await supabase.from("sessions").delete().eq("id", data.id);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/missoes");
  redirect(`/missoes/${data.id}?criada=1`);
}

/** Chama uma RPC e converte o resultado no formato que a tela espera. */
async function callRpc(fn: string, args: Record<string, unknown>, sessionId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { error: error.code === "P0001" ? error.message : GENERIC_ERROR };

  revalidatePath(`/missoes/${sessionId}`);
  revalidatePath("/missoes");

  if (fn === "request_join" && (data as { below_min_level?: boolean } | null)?.below_min_level) {
    return { warning: "Pedido enviado! Seu nível está abaixo do recomendado: o mestre vai decidir." };
  }
  return {};
}

export async function requestJoin(sessionId: string) {
  return callRpc("request_join", { p_session_id: sessionId }, sessionId);
}

export async function respondJoin(sessionId: string, userId: string, approve: boolean) {
  return callRpc("respond_join", { p_session_id: sessionId, p_user_id: userId, p_approve: approve }, sessionId);
}

export async function cancelParticipation(sessionId: string) {
  return callRpc("cancel_participation", { p_session_id: sessionId }, sessionId);
}

export async function cancelMission(sessionId: string) {
  return callRpc("cancel_session", { p_session_id: sessionId }, sessionId);
}
