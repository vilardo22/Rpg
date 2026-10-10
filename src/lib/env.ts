/**
 * Leitura das variáveis de ambiente públicas do Supabase.
 *
 * As variáveis NEXT_PUBLIC_* precisam ser lidas com o nome literal
 * (process.env.NEXT_PUBLIC_X) para o Next.js conseguir embuti-las no bundle do navegador,
 * por isso cada uma é passada explicitamente para `required`.
 */
export function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Copie .env.example para .env.local e preencha os valores.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
