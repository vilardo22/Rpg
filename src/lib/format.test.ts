import { describe, expect, it } from "vitest";
import { formatDuration, formatPrice, formatSessionDate, formatSessionDateLong, toSaoPauloIso } from "./format";

describe("datas no horário de Curitiba", () => {
  // 22h UTC = 19h em Curitiba.
  const iso = "2026-10-10T22:00:00Z";

  it("formata a data curta dos cartões", () => {
    expect(formatSessionDate(iso)).toBe("sáb., 10 de out. · 19:00");
  });

  it("formata a data longa do detalhe", () => {
    expect(formatSessionDateLong(iso)).toBe("sábado, 10 de outubro às 19:00");
  });

  it("converte data e hora digitadas para ISO com o fuso de Curitiba", () => {
    expect(toSaoPauloIso("2026-10-10", "19:00")).toBe("2026-10-10T19:00:00-03:00");
    expect(new Date(toSaoPauloIso("2026-10-10", "19:00")).toISOString()).toBe("2026-10-10T22:00:00.000Z");
  });
});

describe("duração e valor", () => {
  it("formata a duração", () => {
    expect(formatDuration(180)).toBe("3h");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formata o valor em reais", () => {
    expect(formatPrice(1500).replace(/\s/g, " ")).toBe("R$ 15,00");
  });
});
