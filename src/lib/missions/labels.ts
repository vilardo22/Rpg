/**
 * Valores dos enums do banco (em inglês) e seus textos na interface (pt-BR).
 * A ordem das listas é a ordem em que aparecem nos filtros e formulários.
 */

export const GAME_TYPES = ["rpg", "boardgame", "tcg"] as const;
export type GameType = (typeof GAME_TYPES)[number];
export const GAME_TYPE_LABEL: Record<GameType, string> = {
  rpg: "RPG",
  boardgame: "Tabuleiro",
  tcg: "TCG",
};

export const SESSION_MODES = ["presencial", "online"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];
export const SESSION_MODE_LABEL: Record<SessionMode, string> = {
  presencial: "Presencial",
  online: "Online",
};

export const SESSION_KINDS = ["mesa", "torneio"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const SESSION_KIND_LABEL: Record<SessionKind, string> = {
  mesa: "Mesa",
  torneio: "Torneio",
};

export const RECURRENCES = ["none", "weekly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];
export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "Única",
  weekly: "Semanal",
};

export type SessionStatus = "open" | "cancelled" | "completed";
export type ParticipantStatus = "pending" | "approved" | "rejected" | "cancelled";

/**
 * Nomes dos níveis. Os limites de XP ficam no banco (tabela levels), que é
 * quem calcula o nível; aqui fica só o nome para exibir.
 */
export const LEVEL_NAME: Record<number, string> = {
  1: "Novato",
  2: "Aventureiro",
  3: "Veterano",
  4: "Mestre",
};
export const LEVELS = [1, 2, 3, 4] as const;

export function levelName(level: number | null | undefined): string {
  return LEVEL_NAME[level ?? 1] ?? `Nível ${level}`;
}
