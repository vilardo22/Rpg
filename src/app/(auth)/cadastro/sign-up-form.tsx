"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { formatCpf } from "@/lib/cpf";
import { signUpSchema, type SignUpData, type SignUpInput } from "@/lib/validation/auth";
import { signUp } from "../actions";

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<SignUpInput, unknown, SignUpData>({
    resolver: zodResolver(signUpSchema),
    // Valida ao enviar e, depois, a cada correção. Validar ao sair do campo fazia a
    // mensagem de erro empurrar o formulário bem na hora do clique seguinte.
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      cpf: "",
      birthDate: "",
      phone: "",
      acceptTerms: false,
    },
  });

  // Envia os valores como digitados; o servidor valida e normaliza de novo.
  const onSubmit = handleSubmit(() => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await signUp(getValues());
      for (const [field, message] of Object.entries(result?.fieldErrors ?? {})) {
        setError(field as keyof SignUpInput, { message }, { shouldFocus: true });
      }
      setFormError(result?.error);
    });
  });

  const cpf = register("cpf");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={formError} />

      <TextField
        label="Nome de exibição"
        autoComplete="nickname"
        hint="É assim que os outros jogadores vão te ver."
        error={errors.displayName?.message}
        {...register("displayName")}
      />
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
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="CPF"
        inputMode="numeric"
        placeholder="000.000.000-00"
        hint="Usado só para garantir uma conta por pessoa. Ninguém mais vê."
        error={errors.cpf?.message}
        {...cpf}
        onChange={(event) => {
          event.target.value = formatCpf(event.target.value);
          return cpf.onChange(event);
        }}
      />
      <TextField
        label="Data de nascimento"
        type="date"
        hint="O app é para maiores de 18 anos. Ninguém mais vê."
        error={errors.birthDate?.message}
        {...register("birthDate")}
      />
      <TextField
        label="Telefone (opcional)"
        type="tel"
        autoComplete="tel"
        placeholder="(41) 99999-9999"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <div className="space-y-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-roxo"
            aria-invalid={Boolean(errors.acceptTerms)}
            aria-describedby={errors.acceptTerms ? "accept-terms-error" : undefined}
            {...register("acceptTerms")}
          />
          <span>
            Tenho 18 anos ou mais e aceito os termos de uso. Autorizo o uso do meu CPF e da
            minha data de nascimento apenas para verificar identidade e idade (LGPD).
          </span>
        </label>
        {errors.acceptTerms && (
          <p id="accept-terms-error" className="text-sm font-medium text-destructive">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-roxo underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  );
}
