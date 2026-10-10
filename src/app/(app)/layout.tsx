import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { unreadCount } from "@/lib/notifications/queries";

/** Moldura das telas do app: cabeçalho no topo, navegação fixa embaixo. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const unread = await unreadCount();
  return (
    <>
      {/* Atalho para quem navega por teclado pular o cabeçalho (aparece ao receber foco). */}
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-dourado px-4 py-2 font-semibold text-roxo-escuro focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <AppHeader />
      {/* pb-24 evita que o conteúdo fique escondido atrás da navegação inferior. */}
      <main id="conteudo" className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-24">{children}</main>
      <BottomNav unread={unread} />
    </>
  );
}
