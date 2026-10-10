import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications/queries";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Avisos" };

export default async function NotificacoesPage() {
  await requireUser();
  const notifications = await listNotifications();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Avisos</h1>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell aria-hidden className="size-10 text-dourado" />}
          title="Nenhum aviso por enquanto"
          description="Pedidos de entrada, aprovações e missões concluídas vão aparecer aqui."
          action={{ href: "/missoes", label: "Ver missões" }}
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </section>
  );
}
