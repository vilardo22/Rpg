"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";
import { fieldErrorsOf, type FormResult } from "@/lib/validation/errors";

const GENERIC_ERROR = "Não foi possível concluir agora. Tente de novo em instantes.";

/**
 * Cadastro (RF-01). Roda no servidor e usa a secret key porque precisa:
 *  - conferir se o CPF já existe (o usuário comum não pode ler CPFs dos outros);
 *  - criar a conta já confirmada, sem e-mail de confirmação (DECISIONS.md).
 * Se gravar os dados privados falhar, a conta recém-criada é apagada:
 * ninguém fica com cadastro pela metade.
 */
export async function signUp(input: SignUpInput): Promise<FormResult> {
  // Valida de novo no servidor: a validação do navegador pode ser burlada.
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const data = parsed.data;

  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("private_profiles")
    .select("user_id")
    .eq("cpf", data.cpf)
    .maybeSingle();
  if (lookupError) return { error: GENERIC_ERROR };
  if (existing) {
    return { fieldErrors: { cpf: "Já existe uma conta com este CPF. Tente entrar." } };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    // O gatilho handle_new_user usa este nome para criar o perfil público.
    user_metadata: { display_name: data.displayName },
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists") {
      return { fieldErrors: { email: "Já existe uma conta com este e-mail. Tente entrar." } };
    }
    if (createError?.code === "weak_password") {
      return { fieldErrors: { password: "Senha fraca demais. Misture letras e números." } };
    }
    return { error: GENERIC_ERROR };
  }

  const { error: privateError } = await admin.from("private_profiles").insert({
    user_id: created.user.id,
    cpf: data.cpf,
    birth_date: data.birthDate,
    phone: data.phone ?? null,
  });
  if (privateError) {
    await admin.auth.admin.deleteUser(created.user.id);
    // 23505 = violação de unicidade: outro cadastro com o mesmo CPF ao mesmo tempo.
    if (privateError.code === "23505") {
      return { fieldErrors: { cpf: "Já existe uma conta com este CPF. Tente entrar." } };
    }
    return { error: GENERIC_ERROR };
  }

  // Entra na conta recém-criada (grava os cookies de sessão) e vai para a home logada.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  redirect(signInError ? "/entrar" : "/missoes");
}

export async function signIn(input: SignInInput, next?: string): Promise<FormResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }
  redirect(safeNextPath(next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
