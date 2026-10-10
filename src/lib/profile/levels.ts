/**
 * Progresso até o próximo nível, para a barra do perfil (RF-05).
 * Os limites vêm da tabela `levels` do banco: é lá que o nível é calculado de verdade.
 */

export type LevelRow = { level: number; name: string; min_xp: number };

export type LevelProgress = {
  level: number;
  name: string;
  /** Nome do próximo nível, ou null se já está no máximo. */
  nextName: string | null;
  /** Quanto XP falta para o próximo nível (0 no nível máximo). */
  xpToNext: number;
  /** 0 a 100: quanto do caminho entre o nível atual e o próximo já foi feito. */
  percent: number;
};

export function levelProgress(xp: number, levels: LevelRow[]): LevelProgress {
  const sorted = [...levels].sort((a, b) => a.min_xp - b.min_xp);
  // Nível atual = o maior cujo mínimo de XP já foi alcançado.
  const currentIndex = Math.max(0, sorted.findLastIndex((l) => xp >= l.min_xp));
  const current = sorted[currentIndex] ?? { level: 1, name: "Novato", min_xp: 0 };
  const next = sorted[currentIndex + 1];

  if (!next) {
    return { level: current.level, name: current.name, nextName: null, xpToNext: 0, percent: 100 };
  }
  const span = next.min_xp - current.min_xp;
  return {
    level: current.level,
    name: current.name,
    nextName: next.name,
    xpToNext: next.min_xp - xp,
    percent: Math.round(((xp - current.min_xp) / span) * 100),
  };
}
