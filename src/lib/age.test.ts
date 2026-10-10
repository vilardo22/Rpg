import { describe, expect, it } from "vitest";
import { isAdult, todayInSaoPaulo } from "./age";

describe("isAdult", () => {
  it("faz 18 anos exatamente no aniversário", () => {
    expect(isAdult("2008-10-10", "2026-10-10")).toBe(true);
    expect(isAdult("2008-10-11", "2026-10-10")).toBe(false);
  });

  it("aceita adultos e recusa menores", () => {
    expect(isAdult("1990-01-01", "2026-10-10")).toBe(true);
    expect(isAdult("2015-06-01", "2026-10-10")).toBe(false);
  });

  it("quem nasceu em 29/02 completa 18 anos em 01/03", () => {
    expect(isAdult("2008-02-29", "2026-02-28")).toBe(false);
    expect(isAdult("2008-02-29", "2026-03-01")).toBe(true);
  });
});

describe("todayInSaoPaulo", () => {
  it("usa o fuso de Curitiba, não o UTC", () => {
    // 01h UTC do dia 10 ainda é 22h do dia 9 em Curitiba (UTC−3).
    expect(todayInSaoPaulo(new Date("2026-10-10T01:00:00Z"))).toBe("2026-10-09");
    expect(todayInSaoPaulo(new Date("2026-10-10T12:00:00Z"))).toBe("2026-10-10");
  });
});
