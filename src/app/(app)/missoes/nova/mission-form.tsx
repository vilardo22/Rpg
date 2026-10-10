"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceField } from "@/components/form/choice-field";
import { FormError } from "@/components/form/form-error";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  GAME_TYPES,
  GAME_TYPE_LABEL,
  LEVELS,
  RECURRENCE_LABEL,
  RECURRENCES,
  SESSION_KIND_LABEL,
  SESSION_KINDS,
  SESSION_MODE_LABEL,
  SESSION_MODES,
  levelName,
} from "@/lib/missions/labels";
import { missionSchema, type MissionData, type MissionInput } from "@/lib/validation/mission";
import { createMission } from "../actions";

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

const DURATIONS = [60, 90, 120, 180, 240, 300, 360, 480].map((m) => ({
  value: String(m),
  label: m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${m % 60}` : `${m / 60} horas`,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border bg-card/60 p-4">
      <legend className="px-1 font-heading text-lg font-semibold text-roxo">{title}</legend>
      {children}
    </fieldset>
  );
}

export function MissionForm({ venues }: { venues: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<MissionInput, unknown, MissionData>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      title: "",
      gameType: "rpg",
      systemName: "",
      kind: "mesa",
      mode: "presencial",
      date: "",
      time: "19:00",
      durationMinutes: "180",
      maxPlayers: "5",
      recurrence: "none",
      minLevel: "1",
      description: "",
      isPaid: false,
      price: "",
      venueId: "",
      onlineUrl: "",
      contactType: "whatsapp",
      contactPhone: "",
      contactDiscord: "",
    },
  });

  // Campos que mostram/escondem outros campos.
  const [mode, isPaid, contactType] = useWatch({ control, name: ["mode", "isPaid", "contactType"] });

  const onSubmit = handleSubmit(() => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await createMission(getValues());
      for (const [field, message] of Object.entries(result?.fieldErrors ?? {})) {
        setError(field as keyof MissionInput, { message }, { shouldFocus: true });
      }
      setFormError(result?.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={formError} />

      <Section title="O jogo">
        <TextField
          label="Título"
          placeholder="Ex.: A Maldição de Strahd — sessão 0"
          error={errors.title?.message}
          {...register("title")}
        />
        <ChoiceField
          legend="Tipo de jogo"
          options={toOptions(GAME_TYPES, GAME_TYPE_LABEL)}
          error={errors.gameType?.message}
          {...register("gameType")}
        />
        <TextField
          label="Sistema ou jogo (opcional)"
          placeholder="Ex.: D&D 5e, Catan, Pokémon TCG"
          error={errors.systemName?.message}
          {...register("systemName")}
        />
        <ChoiceField legend="Formato" options={toOptions(SESSION_KINDS, SESSION_KIND_LABEL)} {...register("kind")} />
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <textarea
            id="description"
            rows={4}
            placeholder="Conte o clima da mesa, o que levar, se iniciantes são bem-vindos…"
            aria-invalid={Boolean(errors.description)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm font-medium text-destructive">{errors.description.message}</p>
          )}
        </div>
      </Section>

      <Section title="Quando">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Data" type="date" error={errors.date?.message} {...register("date")} />
          <TextField label="Horário" type="time" error={errors.time?.message} {...register("time")} />
        </div>
        <SelectField label="Duração" options={DURATIONS} {...register("durationMinutes")} />
        <ChoiceField
          legend="Recorrência"
          options={toOptions(RECURRENCES, RECURRENCE_LABEL)}
          {...register("recurrence")}
        />
      </Section>

      <Section title="Onde">
        <ChoiceField legend="Modalidade" options={toOptions(SESSION_MODES, SESSION_MODE_LABEL)} {...register("mode")} />
        {mode === "presencial" ? (
          venues.length > 0 ? (
            <SelectField
              label="Local verificado"
              placeholder="Escolha o local"
              hint="Por segurança, missões presenciais só acontecem em locais verificados."
              options={venues.map((v) => ({ value: v.id, label: v.name }))}
              error={errors.venueId?.message}
              {...register("venueId")}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ainda não há locais verificados. Crie uma missão online ou{" "}
              <Link href="/locais" className="font-medium text-roxo underline">
                veja os locais
              </Link>
              .
            </p>
          )
        ) : (
          <TextField
            label="Link da sala"
            type="url"
            placeholder="https://discord.gg/… ou https://meet.google.com/…"
            hint="Só os participantes aprovados veem este link."
            error={errors.onlineUrl?.message}
            {...register("onlineUrl")}
          />
        )}
      </Section>

      <Section title="Vagas">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Jogadores"
            type="number"
            inputMode="numeric"
            min={2}
            max={20}
            hint="Sem contar você."
            error={errors.maxPlayers?.message}
            {...register("maxPlayers")}
          />
          <SelectField
            label="Nível recomendado"
            options={LEVELS.map((l) => ({ value: String(l), label: `${l} · ${levelName(l)}` }))}
            {...register("minLevel")}
          />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input type="checkbox" className="size-5 accent-roxo" {...register("isPaid")} />
          Mesa paga
        </label>
        {isPaid && (
          <TextField
            label="Valor por pessoa (R$)"
            inputMode="decimal"
            placeholder="15,00"
            hint="Só informativo: o pagamento é combinado direto com o mestre."
            error={errors.price?.message}
            {...register("price")}
          />
        )}
      </Section>

      <Section title="Contato do grupo">
        <p className="text-sm text-muted-foreground">
          Aparece só para quem você aprovar. É por aqui que o grupo vai conversar.
        </p>
        <ChoiceField
          legend="Onde o grupo conversa"
          options={[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "discord", label: "Discord" },
          ]}
          {...register("contactType")}
        />
        {contactType === "whatsapp" ? (
          <TextField
            label="Seu WhatsApp"
            type="tel"
            placeholder="(41) 99999-9999"
            error={errors.contactPhone?.message}
            {...register("contactPhone")}
          />
        ) : (
          <TextField
            label="Convite do Discord"
            type="url"
            placeholder="https://discord.gg/…"
            error={errors.contactDiscord?.message}
            {...register("contactDiscord")}
          />
        )}
      </Section>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Publicando…" : "Publicar missão"}
      </Button>
    </form>
  );
}
