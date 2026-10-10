import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Usuário logado nesta requisição, ou null.
 * `cache` evita consultar o Supabase várias vezes na mesma renderização.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const metadata = (data.claims.user_metadata ?? {}) as { experience_level?: number | null };
  return {
    id: data.claims.sub,
    email: data.claims.email as string | undefined,
    /** Experiência autodeclarada (1–4), só preferência de filtro. Null se não informou. */
    experienceLevel: metadata.experience_level ?? null,
  };
});

/** Para páginas e actions que exigem login: devolve o usuário ou manda para /entrar. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

