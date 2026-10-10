"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsOf, type FormResult } from "@/lib/validation/errors";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";

/**
 * Salva o perfil público (tabela profiles; o RLS só deixa editar o próprio e as
 * permissões por coluna impedem mexer em role). A experiência autodeclarada é só
 * uma preferência pessoal de filtro: fica nos metadados da conta, não no perfil público.
 */
export async function updateProfile(input: ProfileInput): Promise<FormResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.displayName,
      bio: data.bio,
      interests: data.interests,
      availability: data.availability,
    })
    .eq("id", user.id);
  if (error) return { error: "Não foi possível salvar agora. Tente de novo em instantes." };

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { experience_level: data.experienceLevel },
  });
  // O app lê a preferência de dentro do token de login (JWT), que guarda uma cópia
  // dos metadados. Sem renovar o token, a mudança só apareceria na próxima renovação.
  if (!metadataError) await supabase.auth.refreshSession();

  revalidatePath(`/perfil/${user.id}`);
  redirect(`/perfil/${user.id}`);
}
