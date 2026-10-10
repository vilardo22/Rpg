import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema, type SignUpInput } from "./auth";

const valid: SignUpInput = {
  displayName: "  Ana Paula ",
  email: " Ana@Exemplo.com ",
  password: "segredo123",
  cpf: "529.982.247-25",
  birthDate: "1995-05-20",
  phone: "(41) 99999-8888",
  acceptTerms: true,
};

/** Mensagem de erro do campo, ou undefined se o campo passou. */
function errorOf(input: Partial<SignUpInput>, field: keyof SignUpInput) {
  const result = signUpSchema.safeParse({ ...valid, ...input });
  return result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("signUpSchema", () => {
  it("normaliza os dados válidos: CPF e telefone só com números, e-mail minúsculo", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      displayName: "Ana Paula",
      email: "ana@exemplo.com",
      password: "segredo123",
      cpf: "52998224725",
      birthDate: "1995-05-20",
      phone: "41999998888",
      acceptTerms: true,
    });
  });

  it("telefone vazio é aceito e vira undefined", () => {
    expect(signUpSchema.parse({ ...valid, phone: "" }).phone).toBeUndefined();
  });

  it("explica cada erro em português", () => {
    expect(errorOf({ cpf: "111.111.111-11" }, "cpf")).toMatch(/CPF inválido/);
    expect(errorOf({ birthDate: "2015-01-01" }, "birthDate")).toMatch(/maiores de 18/);
    expect(errorOf({ birthDate: "" }, "birthDate")).toMatch(/data de nascimento/);
    expect(errorOf({ email: "ana@" }, "email")).toMatch(/e-mail válido/);
    expect(errorOf({ password: "123" }, "password")).toMatch(/8 caracteres/);
    expect(errorOf({ displayName: "A" }, "displayName")).toMatch(/2 letras/);
    expect(errorOf({ phone: "1234" }, "phone")).toMatch(/DDD/);
    expect(errorOf({ acceptTerms: false }, "acceptTerms")).toMatch(/aceite os termos/);
  });
});

describe("signInSchema", () => {
  it("exige e-mail válido e senha", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
