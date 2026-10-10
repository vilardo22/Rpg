import type { Metadata } from "next";
import { listVerifiedVenues } from "@/lib/missions/queries";
import { MissionForm } from "./mission-form";

export const metadata: Metadata = { title: "Criar missão" };

export default async function NovaMissaoPage() {
  const venues = await listVerifiedVenues();

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Criar missão</h1>
        <p className="text-sm text-muted-foreground">Você será o mestre: aprova quem entra e conclui a missão.</p>
      </div>
      <MissionForm venues={venues} />
    </section>
  );
}
