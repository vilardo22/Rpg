"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { signIn } from "../actions";

export function SignInForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await signIn(values, next);
      for (const [field, message] of Object.entries(result?.fieldErrors ?? {})) {
        setError(field as keyof SignInInput, { message });
      }
      setFormError(result?.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={formError} />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-roxo underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
