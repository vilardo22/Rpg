/**
 * Destino depois do login (?next=). Só aceita caminhos internos do app, para que
 * um link como /entrar?next=https://site-falso.com não leve o usuário para fora.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return "/missoes";
  // "//site.com" e "/\site.com" são entendidos pelo navegador como outro domínio.
  if (next.startsWith("//") || next.startsWith("/\\")) return "/missoes";
  return next;
}
