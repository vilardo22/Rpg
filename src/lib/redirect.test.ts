import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeNextPath("/missoes/123")).toBe("/missoes/123");
    expect(safeNextPath("/locais?tipo=rpg")).toBe("/locais?tipo=rpg");
  });

  it("recusa endereços externos e valores estranhos", () => {
    for (const bad of ["https://site-falso.com", "//site-falso.com", "/\\site-falso.com", "", null, undefined, 42]) {
      expect(safeNextPath(bad)).toBe("/missoes");
    }
  });
});
