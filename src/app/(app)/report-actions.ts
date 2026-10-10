"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsOf, type FormResult } from "@/lib/validation/errors";
import { reportSchema, type ReportInput } from "@/lib/validation/report";

/**
 * Envia uma denúncia de perfil ou de missão (RF-06) pela função submit_report,
 * que impede denunciar a si mesmo e repetir denúncia aberta sobre o mesmo alvo.
 */
export async function submitReport(input: ReportInput): Promise<FormResult> {
  await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const r = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_report", {
    p_target_user_id: r.targetUserId ?? null,
    p_target_session_id: r.targetSessionId ?? null,
    p_reason: r.reason,
    p_details: r.details,
  });
  if (error) {
    return { error: error.code === "P0001" ? error.message : "Não foi possível enviar agora. Tente de novo." };
  }
  return {};
}
