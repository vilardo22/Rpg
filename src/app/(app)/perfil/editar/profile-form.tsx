"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckboxGroupField } from "@/components/form/checkbox-group-field";
import { FormError } from "@/components/form/form-error";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GAME_TYPES, GAME_TYPE_LABEL, LEVELS, levelName } from "@/lib/missions/labels";
import { profileSchema, WEEKDAYS, type ProfileData, type ProfileInput } from "@/lib/validation/profile";
import { updateProfile } from "../actions";

export function ProfileForm({ defaultValues, profileId }: { defaultValues: ProfileInput; profileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ProfileInput, unknown, ProfileData>({ resolver: zodResolver(profileSchema), defaultValues });

  const onSubmit = handleSubmit(() => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await updateProfile(getValues());
      for (const [field, message] of Object.entries(result?.fieldErrors ?? {})) {
        setError(field as keyof ProfileInput, { message }, { shouldFocus: true });
      }
      setFormError(result?.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={formError} />
      <TextField label="Nome de exibição" error={errors.displayName?.message} {...register("displayName")} />

      <div className="space-y-1.5">
        <Label htmlFor="bio">Sobre você (opcional)</Label>
        <textarea
          id="bio"
          rows={3}
          maxLength={280}
          placeholder="O que gosta de jogar, há quanto tempo joga, o que procura numa mesa…"
          aria-invalid={Boolean(errors.bio)}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          {...register("bio")}
        />
        {errors.bio && <p className="text-sm font-medium text-destructive">{errors.bio.message}</p>}
      </div>

      <CheckboxGroupField
        legend="Jogos de interesse"
        options={GAME_TYPES.map((g) => ({ value: g, label: GAME_TYPE_LABEL[g] }))}
        {...register("interests")}
      />

      <CheckboxGroupField
        legend="Dias em que costuma jogar"
        hint="Ajuda os mestres a montar mesas nos dias certos."
        columns={4}
        options={WEEKDAYS.map((label, day) => ({ value: String(day), label }))}
        {...register("availability")}
      />

      <SelectField
        label="Sua experiência"
        placeholder="Prefiro não dizer"
        hint="Só para sugerir o filtro de missões. Seu nível oficial vem do XP e não muda por aqui."
        options={LEVELS.map((l) => ({ value: String(l), label: `${l} · ${levelName(l)}` }))}
        {...register("experienceLevel")}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/perfil/${profileId}`}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
