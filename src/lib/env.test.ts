import { describe, expect, it } from "vitest";
import { required } from "./env";

describe("required", () => {
  it("devolve o valor quando a variável existe", () => {
    expect(required("X", "abc")).toBe("abc");
  });

  it("lança erro explicando como corrigir quando a variável falta", () => {
    expect(() => required("NEXT_PUBLIC_SUPABASE_URL", undefined)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*\.env\.local/,
    );
    expect(() => required("X", "")).toThrow();
  });
});
