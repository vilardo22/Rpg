import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { missionToFormDefaults } from "@/lib/missions/copy";
import { getMission, listVerifiedVenues } from "@/lib/missions/queries";
import { MissionForm } from "./mission-form";

export const metadata: Metadata = { title: "Criar missão" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NovaMissaoPage({ searchParams }: PageProps<"/missoes/nova">) {
  const user = await requireUser();
  const { copiar } = await searchParams;
  const [venues, source] = await Promise.all([
    listVerifiedVenues(),
    // ?copiar=<id>: "Criar a próxima" de uma missão semanal. Só o mestre dela pode copiar
    // (só ele recebe o contato pelo RLS, então só ele teria o formulário completo).
    typeof copiar === "string" && UUID.test(copiar) ? getMission(copiar) : null,
  ]);
  const copyFrom = source?.host.id === user.id ? source : null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{copyFrom ? "Criar a próxima" : "Criar missão"}</h1>
        <p className="text-sm text-muted-foreground">
          {copyFrom
            ? `Copiamos os dados de "${copyFrom.title}" com a data da semana seguinte. Revise e publique.`
            : "Você será o mestre: aprova quem entra e conclui a missão."}
        </p>
      </div>
      <MissionForm venues={venues} defaultValues={copyFrom ? missionToFormDefaults(copyFrom) : undefined} />
    </section>
  );
}
