"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/redirect";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications/queries";
import { markAllAsRead, markAsRead } from "./actions";

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Lista de avisos. Tocar num aviso marca como lido e abre a tela relacionada
 * (a missão, o perfil...). Não lidos ficam destacados com um ponto dourado.
 */
export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.read_at);

  function open(n: Notification) {
    startTransition(async () => {
      if (!n.read_at) await markAsRead(n.id);
      if (n.link) router.push(safeNextPath(n.link));
    });
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => startTransition(() => markAllAsRead())}
        >
          Marcar todos como lidos
        </Button>
      )}
      <ul className="divide-y rounded-xl border bg-card">
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              disabled={isPending}
              className={cn(
                "flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left",
                !n.read_at && "bg-dourado/10",
              )}
            >
              <span
                aria-hidden
                className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-dourado")}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block", !n.read_at && "font-semibold")}>
                  {!n.read_at && <span className="sr-only">Não lido: </span>}
                  {n.title}
                </span>
                {n.body && <span className="block text-sm text-muted-foreground">{n.body}</span>}
                <span className="block text-xs text-muted-foreground">{timeFormat.format(new Date(n.created_at))}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
