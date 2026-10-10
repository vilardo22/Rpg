"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveVenue, reviewReport } from "./actions";

/** Par de botões "negativo / positivo" que chama uma ação e mostra o resultado. */
function DecisionButtons({
  onDecide,
  noLabel,
  yesLabel,
  noMessage,
  yesMessage,
}: {
  onDecide: (yes: boolean) => Promise<{ error?: string }>;
  noLabel: string;
  yesLabel: string;
  noMessage: string;
  yesMessage: string;
}) {
  const [isPending, startTransition] = useTransition();
  const decide = (yes: boolean) =>
    startTransition(async () => {
      const result = await onDecide(yes);
      if (result.error) toast.error(result.error);
      else toast.success(yes ? yesMessage : noMessage);
    });

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" disabled={isPending} onClick={() => decide(false)}>
        {noLabel}
      </Button>
      <Button disabled={isPending} onClick={() => decide(true)}>
        {yesLabel}
      </Button>
    </div>
  );
}

export function VenueDecision({ venueId }: { venueId: string }) {
  return (
    <DecisionButtons
      onDecide={(yes) => approveVenue(venueId, yes)}
      noLabel="Rejeitar"
      yesLabel="Aprovar"
      noMessage="Local rejeitado."
      yesMessage="Local aprovado: já aparece no mapa."
    />
  );
}

export function ReportDecision({ reportId }: { reportId: string }) {
  return (
    <DecisionButtons
      onDecide={(yes) => reviewReport(reportId, yes)}
      noLabel="Descartar"
      yesLabel="Confirmar (−30 XP)"
      noMessage="Denúncia descartada."
      yesMessage="Denúncia confirmada: −30 XP aplicados."
    />
  );
}
