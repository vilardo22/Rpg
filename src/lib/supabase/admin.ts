import "server-only";
import { createClient } from "@supabase/supabase-js";
import { required, supabaseUrl } from "@/lib/env";

/**
 * Cliente com a SECRET KEY: ignora todas as políticas RLS.
 * Uso restrito ao servidor e a operações que o usuário não pode fazer sozinho
 * (hoje: criar a conta e conferir se o CPF já existe, no cadastro).
 * O import "server-only" faz o build falhar se alguém importar isto num Client Component.
 */
export function createAdminClient() {
  return createClient(
    supabaseUrl(),
    required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
