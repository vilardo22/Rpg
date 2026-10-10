import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatPrice, formatSessionDate } from "@/lib/format";
import { levelName } from "@/lib/missions/labels";
import type { MissionSummary } from "@/lib/missions/queries";
import { MissionBadges, MissionPlace, SpotsLeft } from "./mission-meta";

/** Cartão da lista de missões. O cartão inteiro é o link (área de toque grande). */
export function MissionCard({ mission }: { mission: MissionSummary }) {
  const started = new Date(mission.starts_at) <= new Date();

  return (
    <Link
      href={`/missoes/${mission.id}`}
      className="block space-y-3 rounded-xl border bg-card p-4 transition-colors hover:border-roxo/40"
    >
      <div className="flex items-start justify-between gap-3">
        <MissionBadges gameType={mission.game_type} kind={mission.kind} recurrence={mission.recurrence} />
        {mission.is_paid && mission.price_cents != null && (
          <span className="shrink-0 text-sm font-semibold text-roxo">{formatPrice(mission.price_cents)}</span>
        )}
      </div>

      <div>
        <h2 className="text-lg leading-snug font-semibold">{mission.title}</h2>
        {mission.system_name && <p className="text-sm text-muted-foreground">{mission.system_name}</p>}
      </div>

      <div className="grid gap-1.5 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-dourado" />
          {started ? <strong>Em andamento</strong> : formatSessionDate(mission.starts_at)}
        </span>
        <MissionPlace mode={mission.mode} venueName={mission.venue?.name} />
        <SpotsLeft approved={mission.approvedCount} max={mission.max_players} />
      </div>

      <p className="border-t pt-2 text-sm text-muted-foreground">
        Mestre: <span className="font-medium text-foreground">{mission.host.display_name}</span>
        {" · "}
        Nv. {mission.host.player_stats?.level ?? 1} {levelName(mission.host.player_stats?.level)}
        {mission.min_level > 1 && <> · recomendado nível {mission.min_level}+</>}
      </p>
    </Link>
  );
}
