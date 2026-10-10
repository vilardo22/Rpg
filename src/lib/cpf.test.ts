import { describe, expect, it } from "vitest";
import { cpfCheckDigits, formatCpf, isValidCpf, onlyDigits } from "./cpf";

describe("isValidCpf", () => {
  it.each(["529.982.247-25", "52998224725", "111.444.777-35", "390.533.447-05", "000.000.001-91"])(
    "aceita o CPF válido %s",
    (cpf) => expect(isValidCpf(cpf)).toBe(true),
  );

  it.each([
    ["dígito verificador errado", "529.982.247-24"],
    ["segundo dígito errado", "111.444.777-36"],
    ["curto demais", "529.982.247"],
    ["longo demais", "529.982.247-255"],
    ["vazio", ""],
    ["letras", "abc.def.ghi-jk"],
  ])("rejeita CPF com %s (%s)", (_motivo, cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it("rejeita todas as sequências repetidas, mesmo as que passariam na conta", () => {
    for (let d = 0; d <= 9; d++) {
      expect(isValidCpf(String(d).repeat(11))).toBe(false);
    }
  });
});

describe("cpfCheckDigits", () => {
  it("calcula os dois dígitos verificadores", () => {
    expect(cpfCheckDigits("529982247")).toBe("25");
    expect(cpfCheckDigits("111444777")).toBe("35");
  });
});

describe("formatCpf e onlyDigits", () => {
  it("aplica a máscara aos poucos, conforme a pessoa digita", () => {
    expect(formatCpf("529")).toBe("529");
    expect(formatCpf("5299")).toBe("529.9");
    expect(formatCpf("5299822")).toBe("529.982.2");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("529982247251234")).toBe("529.982.247-25");
  });

  it("remove a máscara", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
  });
});
