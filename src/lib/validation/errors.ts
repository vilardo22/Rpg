import { z } from "zod";

/** Resposta padrão das Server Actions de formulário. */
export type FormResult = {
  /** Erro geral, mostrado no topo do formulário. */
  error?: string;
  /** Erro por campo: { cpf: "CPF inválido..." }. */
  fieldErrors?: Record<string, string>;
};

/** Converte os erros do zod em { campo: primeira mensagem }. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !result[field]) result[field] = issue.message;
  }
  return result;
}
