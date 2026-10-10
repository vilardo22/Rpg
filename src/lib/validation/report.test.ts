import { describe, expect, it } from "vitest";
import { reportSchema } from "./report";

const user = "6f1c2c1e-1111-4a4a-8888-123456789abc";

function errorOf(input: Record<string, unknown>, field: string) {
  const result = reportSchema.safeParse({ details: "", ...input });
  return result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("reportSchema", () => {
  it("aceita denúncia de perfil com motivo da lista", () => {
    expect(reportSchema.safeParse({ targetUserId: user, reason: "Perfil falso ou golpe", details: "" }).success).toBe(true);
  });

  it("aceita denúncia de missão", () => {
    expect(reportSchema.safeParse({ targetSessionId: user, reason: "Cobrança indevida", details: "" }).success).toBe(true);
  });

  it("exige motivo da lista e um alvo", () => {
    expect(errorOf({ targetUserId: user, reason: "inventado" }, "reason")).toMatch(/motivo/);
    expect(errorOf({ reason: "Conteúdo impróprio" }, "reason")).toMatch(/denunciado/);
  });

  it("'Outro' exige explicação", () => {
    expect(errorOf({ targetUserId: user, reason: "Outro", details: "ruim" }, "details")).toMatch(/Conte/);
    expect(errorOf({ targetUserId: user, reason: "Outro", details: "Ficou ofendendo a mesa" }, "details")).toBeUndefined();
  });
});
