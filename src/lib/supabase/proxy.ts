import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

/** Rotas abertas para quem não está logado. Todo o resto exige login. */
const PUBLIC_PATHS = ["/", "/entrar", "/cadastro"];
/** Rotas que não fazem sentido para quem já está logado. */
const AUTH_PATHS = ["/entrar", "/cadastro"];

/**
 * Roda antes de cada página (via src/proxy.ts):
 * 1. renova o token de sessão do Supabase e grava os cookies atualizados;
 * 2. manda quem não está logado para /entrar (guardando a página pedida em ?next=);
 * 3. manda quem já está logado de /entrar e /cadastro para /missoes.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims valida o token; não troque por getSession, que confia no cookie sem conferir.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/missoes";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
