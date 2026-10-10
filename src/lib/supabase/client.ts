import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

/**
 * Cliente Supabase para Client Components (roda no navegador).
 * Usa só a chave pública (publishable): tudo que ele pode fazer é limitado pelas políticas RLS.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabasePublishableKey());
}
