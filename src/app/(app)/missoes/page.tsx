import type { Metadata } from "next";
import Link from "next/link";
import { Scroll } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { MissionCard } from "@/components/missions/mission-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { filtersToQuery, hasActiveFilters, PAGE_SIZE, parseFilters } from "@/lib/missions/filters";
import { listMissions, listVerifiedVenues } from "@/lib/missions/queries";
import { cn } from "@/lib/utils";
import { MissionFiltersPanel } from "./mission-filters";

export const metadata: Metadata = { title: "Missões" };

export default async function MissoesPage({ searchParams }: PageProps<"/missoes">) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);
  const [{ missions, total }, venues] = await Promise.all([
    listMissions(filters, user.id),
    listVerifiedVenues(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tabs = [
    { tab: "todas" as const, label: "Todas" },
    { tab: "minhas" as const, label: "Minhas" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Missões</h1>
        <Button asChild>
          <Link href="/missoes/nova">Criar missão</Link>
        </Button>
      </div>

      <nav aria-label="Abas da lista" className="grid grid-cols-2 rounded-lg bg-secondary p-1">
        {tabs.map(({ tab, label }) => (
          <Link
            key={tab}
            href={filtersToQuery({ tab, page: 1 })}
            aria-current={filters.tab === tab ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-center rounded-md text-sm font-medium",
              filters.tab === tab ? "bg-card text-roxo shadow-sm" : "text-muted-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <MissionFiltersPanel filters={filters} venues={venues} />

      {missions.length === 0 ? (
        <EmptyState
          icon={<Scroll aria-hidden className="size-10 text-dourado" />}
          title={
            hasActiveFilters(filters)
              ? "Nenhuma missão com esses filtros"
              : filters.tab === "minhas"
                ? "Você ainda não está em nenhuma missão"
                : "Nenhuma missão por aqui"
          }
          description={
            hasActiveFilters(filters)
              ? "Tente outro dia ou limpe os filtros."
              : "Crie a primeira e chame o pessoal para jogar."
          }
          action={{ href: "/missoes/nova", label: "Criar missão" }}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? "missão encontrada" : "missões encontradas"}
          </p>
          <ul className="space-y-3">
            {missions.map((mission) => (
              <li key={mission.id}>
                <MissionCard mission={mission} />
              </li>
            ))}
          </ul>
        </>
      )}

      {totalPages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between gap-3 pt-2">
          {filters.page > 1 ? (
            <Button asChild variant="outline">
              <Link href={filtersToQuery(filters, { page: filters.page - 1 })}>Anterior</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Página {filters.page} de {totalPages}
          </span>
          {filters.page < totalPages ? (
            <Button asChild variant="outline">
              <Link href={filtersToQuery(filters, { page: filters.page + 1 })}>Próxima</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
