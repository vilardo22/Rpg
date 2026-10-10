"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { completeMission } from "../actions";
import { useMissionAction } from "./use-mission-action";

type Player = { userId: string; name: string };

/**
 * Concluir missão (só o mestre, depois do horário de início). Todos começam
 * marcados como presentes; o mestre desmarca quem faltou. O XP é calculado no banco:
 * presente +10 (+20 em torneio), falta −15, mestre +15.
 */
export function CompleteMission({
  sessionId,
  players,
  isTournament,
}: {
  sessionId: string;
  players: Player[];
  isTournament: boolean;
}) {
  const [attended, setAttended] = useState<Set<string>>(() => new Set(players.map((p) => p.userId)));
  const { isPending, run } = useMissionAction();
  const absent = players.filter((p) => !attended.has(p.userId));

  function toggle(userId: string) {
    setAttended((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <section aria-labelledby="concluir" className="space-y-3 rounded-xl border-2 border-dourado/60 bg-card p-4">
      <h2 id="concluir" className="flex items-center gap-2 text-lg font-semibold">
        <Trophy aria-hidden className="size-5 text-dourado" /> Concluir missão
      </h2>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém foi aprovado. Concluir só registra a missão como mestrada.</p>
      ) : (
        <fieldset className="space-y-1">
          <legend className="mb-2 text-sm text-muted-foreground">Desmarque quem não compareceu:</legend>
          {players.map((p) => (
            <label key={p.userId} className="flex min-h-11 items-center gap-3 rounded-lg px-1 font-medium">
              <input
                type="checkbox"
                className="size-5 accent-roxo"
                checked={attended.has(p.userId)}
                onChange={() => toggle(p.userId)}
              />
              {p.name}
              <span className="ml-auto text-sm text-muted-foreground">
                {attended.has(p.userId) ? (isTournament ? "+20 XP" : "+10 XP") : "falta · −15 XP"}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Concluindo…" : "Concluir missão"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir a missão?</AlertDialogTitle>
            <AlertDialogDescription>
              {absent.length === 0
                ? "Todos serão marcados como presentes."
                : `Falta para: ${absent.map((p) => p.name).join(", ")}.`}{" "}
              O XP de todos é atualizado e não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(() => completeMission(sessionId, [...attended]), "Missão concluída! O XP de todos foi atualizado.")
              }
            >
              Concluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
