import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Notificações dentro do app (RF-07). O RLS só devolve as do próprio usuário. */

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Quantas não lidas (para o contador na navegação). Só conta, não traz as linhas. */
export const unreadCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
});

export async function listNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Erro ao carregar avisos: ${error.message}`);
  return data as Notification[];
}
