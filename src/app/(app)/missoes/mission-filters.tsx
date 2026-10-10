"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { filtersToQuery, hasActiveFilters, type MissionFilters } from "@/lib/missions/filters";
import {
  GAME_TYPES,
  GAME_TYPE_LABEL,
  LEVELS,
  SESSION_KINDS,
  SESSION_KIND_LABEL,
  SESSION_MODES,
  SESSION_MODE_LABEL,
  levelName,
  type GameType,
  type SessionKind,
  type SessionMode,
} from "@/lib/missions/labels";

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

/**
 * Painel de filtros. Cada mudança atualiza a URL na hora (sem botão "aplicar");
 * a página, que é renderizada no servidor, lê os filtros da URL e refaz a busca.
 */
export function MissionFiltersPanel({
  filters,
  venues,
}: {
  filters: MissionFilters;
  venues: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = hasActiveFilters(filters);

  function update(changes: Partial<MissionFilters>) {
    // Mudou o filtro: volta para a página 1.
    startTransition(() => router.push(filtersToQuery(filters, { ...changes, page: 1 })));
  }

  return (
    <details open={active} className="group rounded-xl border bg-card" aria-busy={isPending}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 font-medium">
        <SlidersHorizontal aria-hidden className="size-4 text-dourado" />
        Filtros
        {active && <span className="text-sm text-muted-foreground">(ativos)</span>}
        {isPending && <span className="ml-auto text-sm text-muted-foreground">Atualizando…</span>}
      </summary>

      <div className="grid grid-cols-2 gap-3 border-t p-4">
        <SelectField
          label="Jogo"
          placeholder="Todos"
          options={toOptions(GAME_TYPES, GAME_TYPE_LABEL)}
          value={filters.gameType ?? ""}
          onChange={(e) => update({ gameType: (e.target.value || undefined) as GameType | undefined })}
        />
        <SelectField
          label="Modalidade"
          placeholder="Todas"
          options={toOptions(SESSION_MODES, SESSION_MODE_LABEL)}
          value={filters.mode ?? ""}
          onChange={(e) => update({ mode: (e.target.value || undefined) as SessionMode | undefined })}
        />
        <SelectField
          label="Formato"
          placeholder="Todos"
          options={toOptions(SESSION_KINDS, SESSION_KIND_LABEL)}
          value={filters.kind ?? ""}
          onChange={(e) => update({ kind: (e.target.value || undefined) as SessionKind | undefined })}
        />
        <SelectField
          label="Meu nível"
          placeholder="Qualquer"
          hint="Esconde missões que pedem nível maior."
          options={LEVELS.map((l) => ({ value: String(l), label: `${l} · ${levelName(l)}` }))}
          value={filters.level ? String(filters.level) : ""}
          onChange={(e) => update({ level: e.target.value ? Number(e.target.value) : undefined })}
        />
        <SelectField
          className="col-span-2"
          label="Local"
          placeholder="Todos os locais"
          options={venues.map((v) => ({ value: v.id, label: v.name }))}
          value={filters.venueId ?? ""}
          onChange={(e) => update({ venueId: e.target.value || undefined })}
        />
        <div className="col-span-2">
          <TextField
            label="Dia"
            type="date"
            value={filters.date ?? ""}
            onChange={(e) => update({ date: e.target.value || undefined })}
          />
        </div>
        {active && (
          <Button
            type="button"
            variant="outline"
            className="col-span-2"
            onClick={() => startTransition(() => router.push(filtersToQuery({ tab: filters.tab, page: 1 })))}
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </details>
  );
}
