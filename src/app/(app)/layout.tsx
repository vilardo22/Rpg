import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { unreadCount } from "@/lib/notifications/queries";

/** Moldura das telas do app: cabeçalho no topo, navegação fixa embaixo. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const unread = await unreadCount();
  return (
    <>
      <AppHeader />
      {/* pb-24 evita que o conteúdo fique escondido atrás da navegação inferior. */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-24">{children}</main>
      <BottomNav unread={unread} />
    </>
  );
}
