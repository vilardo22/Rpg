import { z } from "zod";
import { isAdult } from "@/lib/age";
import { isValidCpf, onlyDigits } from "@/lib/cpf";

/**
 * Regras dos formulários de cadastro e login. O mesmo schema roda no navegador
 * (erro aparece na hora) e no servidor (a validação que vale de verdade).
 */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido, como nome@exemplo.com." }));

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: "O nome precisa ter pelo menos 2 letras." })
    .max(40, { error: "Use no máximo 40 caracteres." }),
  email,
  password: z
    .string()
    .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
    .max(72, { error: "Use no máximo 72 caracteres." }),
  cpf: z
    .string()
    .refine(isValidCpf, { error: "CPF inválido. Confira os 11 números." })
    .transform(onlyDigits),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe sua data de nascimento." })
    .refine((date) => isAdult(date), {
      error: "O Quadro de Missões é só para maiores de 18 anos.",
    }),
  // Telefone é opcional: vazio vira undefined; preenchido precisa ter DDD + número.
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((digits) => digits === "" || /^\d{10,11}$/.test(digits), {
      error: "Telefone com DDD, ex.: (41) 99999-9999.",
    })
    .transform((digits) => digits || undefined),
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    error: "Para criar a conta, aceite os termos e o uso dos dados.",
  }),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type SignInInput = z.input<typeof signInSchema>;
