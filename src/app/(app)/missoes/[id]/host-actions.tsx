"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { LevelBadge } from "@/components/missions/mission-meta";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Participant } from "@/lib/missions/queries";
import { cancelMission, respondJoin } from "../actions";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
import { useMissionAction } from "./use-mission-action";

/** Pedidos pendentes, vistos só pelo mestre: perfil, nível e aprovar/recusar. */
export function JoinRequests({
  sessionId,
  requests,
  underReview,
  isFull,
}: {
  sessionId: string;
  requests: Participant[];
  underReview: string[];
  isFull: boolean;
}) {
  const { isPending, run } = useMissionAction();

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido aguardando.</p>;
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const stats = r.profile.player_stats;
        return (
          <li key={r.user_id} className="space-y-3 rounded-lg border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/perfil/${r.user_id}`} className="font-semibold text-roxo underline underline-offset-4">
                {r.profile.display_name}
              </Link>
              <LevelBadge level={stats?.level} />
              {underReview.includes(r.user_id) && (
                // RF-06: 3+ denúncias abertas. O mestre só vê o selo, não as denúncias.
                <Badge className="bg-destructive text-white">
                  <ShieldAlert aria-hidden /> Em análise
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {plural(stats?.sessions_played ?? 0, "missão jogada", "missões jogadas")} ·{" "}
              {plural(stats?.no_shows ?? 0, "falta", "faltas")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => respondJoin(sessionId, r.user_id, false), "Pedido recusado.")}
              >
                Recusar
              </Button>
              <Button
                disabled={isPending || isFull}
                onClick={() => run(() => respondJoin(sessionId, r.user_id, true), "Jogador aprovado!")}
              >
                Aprovar
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Botão do mestre para tirar um jogador aprovado da missão. */
export function RemoveParticipantButton({ sessionId, userId, name }: { sessionId: string; userId: string; name: string }) {
  const { isPending, run } = useMissionAction();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11 text-destructive" disabled={isPending}>
          Remover
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover {name}?</AlertDialogTitle>
          <AlertDialogDescription>A vaga é liberada e a pessoa é avisada.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => run(() => respondJoin(sessionId, userId, false), `${name} saiu da missão.`)}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Mestre cancela a missão inteira (avisa todos os participantes). */
export function CancelMissionButton({ sessionId }: { sessionId: string }) {
  const { isPending, run } = useMissionAction();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full" disabled={isPending}>
          Cancelar missão
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar esta missão?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os participantes e quem pediu para entrar serão avisados. Não dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => run(() => cancelMission(sessionId), "Missão cancelada.")}
          >
            Cancelar missão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
