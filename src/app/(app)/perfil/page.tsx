import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

/** "Perfil" na navegação inferior: abre o perfil público do próprio usuário. */
export default async function PerfilPage() {
  const user = await requireUser();
  redirect(`/perfil/${user.id}`);
}
