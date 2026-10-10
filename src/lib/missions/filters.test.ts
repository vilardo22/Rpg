import { describe, expect, it } from "vitest";
import { filtersToQuery, hasActiveFilters, parseFilters } from "./filters";

describe("parseFilters", () => {
  it("lê os filtros válidos da URL", () => {
    expect(
      parseFilters({
        aba: "minhas",
        jogo: "rpg",
        modalidade: "online",
        formato: "torneio",
        local: "6f1c2c1e-1111-4a4a-8888-123456789abc",
        data: "2026-10-20",
        nivel: "2",
        pagina: "3",
      }),
    ).toEqual({
      tab: "minhas",
      gameType: "rpg",
      mode: "online",
      kind: "torneio",
      venueId: "6f1c2c1e-1111-4a4a-8888-123456789abc",
      date: "2026-10-20",
      level: 2,
      page: 3,
    });
  });

  it("ignora valores inválidos em vez de quebrar", () => {
    expect(
      parseFilters({ aba: "x", jogo: "xadrez", local: "1; drop table", data: "amanhã", nivel: "9", pagina: "-2" }),
    ).toEqual({ tab: "todas", page: 1 });
  });
});

describe("filtersToQuery", () => {
  it("monta a URL só com o que está preenchido", () => {
    const f = parseFilters({ jogo: "tcg", pagina: "2" });
    expect(filtersToQuery(f)).toBe("/missoes?jogo=tcg&pagina=2");
    expect(filtersToQuery(f, { page: 3 })).toBe("/missoes?jogo=tcg&pagina=3");
    expect(filtersToQuery(parseFilters({}))).toBe("/missoes");
  });

  it("hasActiveFilters não conta aba nem página", () => {
    expect(hasActiveFilters(parseFilters({ aba: "minhas", pagina: "2" }))).toBe(false);
    expect(hasActiveFilters(parseFilters({ nivel: "1" }))).toBe(true);
  });
});
