import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16, o antigo middleware.ts se chama proxy.ts.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Não roda para arquivos estáticos (JS/CSS, imagens, ícones, manifesto PWA).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|icons/).*)",
  ],
};
