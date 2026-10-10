import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
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

/** O usuário logado é admin? (coluna role do perfil; o usuário não consegue alterá-la). */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
});

/**
 * Para o painel /admin (RF-08): quem não é admin recebe "página não encontrada",
 * sem nem confirmar que a rota existe. As funções do banco conferem de novo.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAdmin())) notFound();
  return user;
}
