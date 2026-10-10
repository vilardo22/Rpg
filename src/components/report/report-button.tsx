"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { submitReport } from "@/app/(app)/report-actions";
import { FormError } from "@/components/form/form-error";
import { SelectField } from "@/components/form/select-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { REPORT_REASONS, reportSchema, type ReportInput } from "@/lib/validation/report";

/**
 * Botão "Denunciar" (RF-06) para um perfil ou uma missão. Abre um diálogo com
 * motivo (lista fixa) e detalhes. A denúncia vai para análise do admin; quem foi
 * denunciado não é avisado e não vê quem denunciou.
 */
export function ReportButton({
  target,
  label,
}: {
  target: { userId: string } | { sessionId: string };
  /** Nome do perfil ou título da missão, para o texto do diálogo. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const targetIds =
    "userId" in target ? { targetUserId: target.userId } : { targetSessionId: target.sessionId };

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { ...targetIds, reason: undefined, details: "" },
  });

  const onSubmit = handleSubmit(() => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await submitReport(getValues());
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof ReportInput, { message });
      }
      if (result.error) return setFormError(result.error);
      if (!result.fieldErrors) {
        toast.success("Denúncia enviada. A equipe vai analisar, obrigado por avisar.");
        reset();
        setOpen(false);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-muted-foreground">
          <Flag aria-hidden /> Denunciar {"userId" in target ? "perfil" : "missão"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Denunciar {label}</DialogTitle>
            <DialogDescription>
              Sua identidade não é mostrada para quem foi denunciado. A equipe do Quadro de Missões analisa cada caso.
            </DialogDescription>
          </DialogHeader>
          <FormError message={formError} />
          <SelectField
            label="Motivo"
            placeholder="Escolha um motivo"
            options={REPORT_REASONS.map((r) => ({ value: r, label: r }))}
            error={errors.reason?.message}
            {...register("reason")}
          />
          <div className="space-y-1.5">
            <Label htmlFor="report-details">Detalhes (opcional)</Label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={1000}
              placeholder="O que aconteceu? Datas e contexto ajudam a analisar."
              aria-invalid={Boolean(errors.details)}
              aria-describedby={errors.details ? "report-details-error" : undefined}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              {...register("details")}
            />
            {errors.details && (
              <p id="report-details-error" className="text-sm font-medium text-destructive">
                {errors.details.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Enviando…" : "Enviar denúncia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
