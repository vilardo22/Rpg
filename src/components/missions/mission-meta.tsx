import { Globe, MapPin, Repeat, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GAME_TYPE_LABEL,
  levelName,
  type GameType,
  type Recurrence,
  type SessionKind,
  type SessionMode,
} from "@/lib/missions/labels";

/** Selos do tipo de jogo, torneio e recorrência. */
export function MissionBadges({
  gameType,
  kind,
  recurrence,
}: {
  gameType: GameType;
  kind: SessionKind;
  recurrence: Recurrence;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className="bg-roxo text-pergaminho">{GAME_TYPE_LABEL[gameType]}</Badge>
      {kind === "torneio" && (
        <Badge className="bg-dourado text-roxo-escuro">
          <Trophy aria-hidden /> Torneio
        </Badge>
      )}
      {recurrence === "weekly" && (
        <Badge variant="outline">
          <Repeat aria-hidden /> Semanal
        </Badge>
      )}
    </div>
  );
}

/** "Presencial · Joy Joy Café" ou "Online". */
export function MissionPlace({ mode, venueName }: { mode: SessionMode; venueName?: string }) {
  const Icon = mode === "online" ? Globe : MapPin;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-4 shrink-0 text-dourado" />
      {mode === "online" ? "Online" : (venueName ?? "Presencial")}
    </span>
  );
}

/** "3 vagas livres de 5" (o mestre não ocupa vaga). */
export function SpotsLeft({ approved, max }: { approved: number; max: number }) {
  const left = Math.max(0, max - approved);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Users aria-hidden className="size-4 shrink-0 text-dourado" />
      {left === 0 ? (
        <strong className="text-destructive">Lotada</strong>
      ) : (
        `${left} ${left === 1 ? "vaga livre" : "vagas livres"} de ${max}`
      )}
    </span>
  );
}

/** Selo de nível: "Nv. 2 · Aventureiro". */
export function LevelBadge({ level }: { level: number | null | undefined }) {
  return (
    <Badge variant="outline" className="border-dourado/60 text-roxo">
      Nv. {level ?? 1} · {levelName(level)}
    </Badge>
  );
}
