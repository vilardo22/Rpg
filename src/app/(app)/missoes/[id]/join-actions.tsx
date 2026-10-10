"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParticipantStatus } from "@/lib/missions/labels";
import { cancelParticipation, requestJoin } from "../actions";
import { useMissionAction } from "./use-mission-action";

/**
 * Botão principal para quem NÃO é o mestre, conforme a situação:
 * sem pedido → "Pedir para entrar"; pendente → aguardando; aprovado → está dentro.
 */
export function JoinActions({
  sessionId,
  myStatus,
  isFull,
  belowMinLevel,
}: {
  sessionId: string;
  myStatus: ParticipantStatus | null;
  isFull: boolean;
  belowMinLevel: boolean;
}) {
  const { isPending, run } = useMissionAction();

  if (myStatus === "approved") {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-roxo">
          <CheckCircle2 aria-hidden className="size-5 text-dourado" />
          Você está dentro! Use o contato abaixo para falar com o grupo.
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => run(() => cancelParticipation(sessionId), "Você saiu da missão.")}
        >
          Sair da missão
        </Button>
      </div>
    );
  }

  if (myStatus === "pending") {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 font-medium">
          <Clock aria-hidden className="size-5 text-dourado" />
          Pedido enviado. Aguardando o mestre.
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => run(() => cancelParticipation(sessionId), "Pedido cancelado.")}
        >
          Cancelar pedido
        </Button>
      </div>
    );
  }

  if (myStatus === "rejected") {
    return <p className="text-muted-foreground">O mestre não aprovou sua entrada nesta missão.</p>;
  }

  if (isFull) {
    return <p className="font-medium text-destructive">Missão lotada: todas as vagas foram preenchidas.</p>;
  }

  return (
    <div className="space-y-2">
      {belowMinLevel && (
        <p className="text-sm text-muted-foreground">
          O mestre recomenda um nível maior que o seu. Você pode pedir mesmo assim.
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={() => run(() => requestJoin(sessionId), "Pedido enviado! O mestre vai avaliar.")}
      >
        {isPending ? "Enviando…" : "Pedir para entrar"}
      </Button>
    </div>
  );
}
