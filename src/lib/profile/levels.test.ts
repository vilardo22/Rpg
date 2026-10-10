import { describe, expect, it } from "vitest";
import { levelProgress, type LevelRow } from "./levels";

// Mesmos valores do PRD (tabela levels do banco).
const LEVELS: LevelRow[] = [
  { level: 3, name: "Veterano", min_xp: 150 },
  { level: 1, name: "Novato", min_xp: 0 },
  { level: 4, name: "Mestre", min_xp: 300 },
  { level: 2, name: "Aventureiro", min_xp: 50 },
];

describe("levelProgress", () => {
  it("Novato com 0 XP: começo da barra, faltam 50", () => {
    expect(levelProgress(0, LEVELS)).toEqual({
      level: 1, name: "Novato", nextName: "Aventureiro", xpToNext: 50, percent: 0,
    });
  });

  it("limites exatos dos níveis do PRD", () => {
    expect(levelProgress(49, LEVELS).level).toBe(1);
    expect(levelProgress(50, LEVELS).level).toBe(2);
    expect(levelProgress(149, LEVELS).level).toBe(2);
    expect(levelProgress(150, LEVELS).level).toBe(3);
    expect(levelProgress(299, LEVELS).level).toBe(3);
    expect(levelProgress(300, LEVELS).level).toBe(4);
  });

  it("calcula a porcentagem dentro da faixa do nível", () => {
    // Aventureiro vai de 50 a 150: com 100 XP está na metade.
    expect(levelProgress(100, LEVELS)).toMatchObject({ percent: 50, xpToNext: 50, nextName: "Veterano" });
  });

  it("nível máximo: barra cheia e sem próximo nível", () => {
    expect(levelProgress(999, LEVELS)).toEqual({
      level: 4, name: "Mestre", nextName: null, xpToNext: 0, percent: 100,
    });
  });
});
