import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AtSign, MapPin, Navigation } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { MissionCard } from "@/components/missions/mission-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VenueMap } from "@/components/venues/venue-map-loader";
import { requireUser } from "@/lib/auth";
import { parseFilters } from "@/lib/missions/filters";
import { GAME_TYPE_LABEL } from "@/lib/missions/labels";
import { listMissions } from "@/lib/missions/queries";
import { directionsUrl, instagramUrl } from "@/lib/venues/links";
import { getVenue } from "@/lib/venues/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/locais/[id]">): Promise<Metadata> {
  const { id } = await params;
  const venue = UUID.test(id) ? await getVenue(id) : null;
  return { title: venue?.name ?? "Local" };
}

export default async function LocalPage({ params }: PageProps<"/locais/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await requireUser();
  const venue = await getVenue(id);
  if (!venue) notFound();

  // Reaproveita a lista de missões com o filtro "neste local".
  const { missions } = await listMissions({ ...parseFilters({}), venueId: venue.id }, user.id);
  const instagram = instagramUrl(venue.instagram);

  return (
    <article className="space-y-5">
      <Link href="/locais" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-roxo">
        <ArrowLeft aria-hidden className="size-4" /> Locais
      </Link>

      {!venue.is_verified && (
        // Só quem sugeriu e os admins chegam aqui (RLS); para os outros a página nem existe.
        <p role="status" className="rounded-lg bg-secondary p-3 text-sm font-medium">
          Aguardando verificação: este local ainda não aparece para os outros jogadores.
        </p>
      )}

      <header className="space-y-2">
        <h1 className="text-2xl leading-tight font-semibold">{venue.name}</h1>
        <p className="flex gap-1.5 text-muted-foreground">
          <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-dourado" />
          {venue.address} · {venue.city}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {venue.game_types.map((g) => (
            <Badge key={g} className="bg-roxo text-pergaminho">
              {GAME_TYPE_LABEL[g]}
            </Badge>
          ))}
        </div>
      </header>

      <VenueMap venues={[venue]} height={220} showPopups={false} />

      <div className={instagram ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
        <Button asChild variant="outline">
          <a href={directionsUrl(venue.lat, venue.lng)} target="_blank" rel="noopener noreferrer">
            <Navigation aria-hidden /> Como chegar
          </a>
        </Button>
        {instagram && (
          <Button asChild variant="outline">
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              <AtSign aria-hidden /> Instagram
            </a>
          </Button>
        )}
      </div>

      {venue.description && <p className="whitespace-pre-line">{venue.description}</p>}

      <section aria-labelledby="agenda" className="space-y-3">
        <h2 id="agenda" className="text-lg font-semibold">
          Missões agendadas
        </h2>
        {missions.length === 0 ? (
          <EmptyState
            title="Nenhuma missão agendada aqui"
            description={venue.is_verified ? "Que tal marcar a primeira?" : undefined}
            action={venue.is_verified ? { href: "/missoes/nova", label: "Criar missão" } : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {missions.map((mission) => (
              <li key={mission.id}>
                <MissionCard mission={mission} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
