import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { VenueMap } from "@/components/venues/venue-map-loader";
import { GAME_TYPE_LABEL } from "@/lib/missions/labels";
import { listVenues } from "@/lib/venues/queries";

export const metadata: Metadata = { title: "Locais" };

export default async function LocaisPage() {
  const venues = await listVenues();

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Locais</h1>
        <p className="text-sm text-muted-foreground">
          Cafés, ludotecas e lojas verificados em Curitiba. Missões presenciais só acontecem aqui.
        </p>
      </div>

      {venues.length === 0 ? (
        <EmptyState
          icon={<MapPin aria-hidden className="size-10 text-dourado" />}
          title="Nenhum local verificado ainda"
          description="Enquanto isso, que tal uma missão online?"
          action={{ href: "/missoes/nova", label: "Criar missão" }}
        />
      ) : (
        <>
          <VenueMap venues={venues} />

          {/* A lista repete o que está no mapa: é o caminho acessível por teclado e leitor de tela. */}
          <ul className="space-y-3">
            {venues.map((venue) => (
              <li key={venue.id}>
                <Link
                  href={`/locais/${venue.id}`}
                  className="block space-y-2 rounded-xl border bg-card p-4 transition-colors hover:border-roxo/40"
                >
                  <h2 className="text-lg font-semibold">{venue.name}</h2>
                  <p className="flex gap-1.5 text-sm text-muted-foreground">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-dourado" />
                    {venue.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {venue.game_types.map((g) => (
                      <Badge key={g} variant="outline">
                        {GAME_TYPE_LABEL[g]}
                      </Badge>
                    ))}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-roxo">
                    <CalendarDays aria-hidden className="size-4 text-dourado" />
                    {venue.upcoming.length === 0
                      ? "Nenhuma missão agendada"
                      : venue.upcoming.length === 1
                        ? "1 missão agendada"
                        : `${venue.upcoming.length} missões agendadas`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
