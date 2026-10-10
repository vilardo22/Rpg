import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile/queries";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditarPerfilPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) notFound();

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tudo aqui é público. CPF, data de nascimento e telefone nunca aparecem para ninguém.
        </p>
      </div>
      <ProfileForm
        profileId={profile.id}
        defaultValues={{
          displayName: profile.display_name,
          bio: profile.bio ?? "",
          interests: profile.interests,
          availability: profile.availability.map(String),
          experienceLevel: user.experienceLevel ? String(user.experienceLevel) : "",
        }}
      />
    </section>
  );
}
