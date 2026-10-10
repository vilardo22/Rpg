import { GAME_TYPES, SESSION_KINDS, SESSION_MODES, type GameType, type SessionKind, type SessionMode } from "./labels";

/**
 * Filtros da lista de missões. Ficam na URL (/missoes?jogo=rpg&modalidade=online),
 * então dá para compartilhar um link já filtrado e o botão "voltar" funciona.
 * Valores inválidos na URL são ignorados em vez de quebrar a página.
 */
export type MissionFilters = {
  tab: "todas" | "minhas";
  gameType?: GameType;
  mode?: SessionMode;
  kind?: SessionKind;
  venueId?: string;
  /** Dia da missão, AAAA-MM-DD. */
  date?: string;
  /** Nível do jogador: mostra missões com nível recomendado até este. */
  level?: number;
  page: number;
};

export const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(list: readonly T[], value: string | undefined): T | undefined {
  return list.includes(value as T) ? (value as T) : undefined;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseFilters(params: SearchParams): MissionFilters {
  const date = first(params.data);
  const level = Number(first(params.nivel));
  const page = Number(first(params.pagina));
  const venueId = first(params.local);

  return {
    tab: first(params.aba) === "minhas" ? "minhas" : "todas",
    gameType: oneOf(GAME_TYPES, first(params.jogo)),
    mode: oneOf(SESSION_MODES, first(params.modalidade)),
    kind: oneOf(SESSION_KINDS, first(params.formato)),
    venueId: venueId && UUID.test(venueId) ? venueId : undefined,
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    level: Number.isInteger(level) && level >= 1 && level <= 4 ? level : undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Monta a URL da lista com os filtros atuais e algumas mudanças (ex.: outra página). */
export function filtersToQuery(filters: MissionFilters, changes: Partial<MissionFilters> = {}): string {
  const f = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (f.tab === "minhas") params.set("aba", "minhas");
  if (f.gameType) params.set("jogo", f.gameType);
  if (f.mode) params.set("modalidade", f.mode);
  if (f.kind) params.set("formato", f.kind);
  if (f.venueId) params.set("local", f.venueId);
  if (f.date) params.set("data", f.date);
  if (f.level) params.set("nivel", String(f.level));
  if (f.page > 1) params.set("pagina", String(f.page));
  const query = params.toString();
  return query ? `/missoes?${query}` : "/missoes";
}

/** Há algum filtro aplicado (além da aba e da página)? */
export function hasActiveFilters(f: MissionFilters): boolean {
  return Boolean(f.gameType || f.mode || f.kind || f.venueId || f.date || f.level);
}
