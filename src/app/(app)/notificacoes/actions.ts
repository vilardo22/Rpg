"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Marcar como lida. O usuário só pode mexer na coluna read_at das próprias
 * notificações (permissão por coluna + RLS); o filtro por user_id é só clareza.
 */
export async function markAsRead(notificationId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout"); // o contador aparece em todas as telas
}

export async function markAllAsRead() {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}
