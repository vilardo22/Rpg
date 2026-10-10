import { z } from "zod";

/** Motivos fixos de denúncia (RF-06). "Outro" exige explicar nos detalhes. */
export const REPORT_REASONS = [
  "Comportamento ofensivo ou assédio",
  "Não compareceu ou sumiu",
  "Perfil falso ou golpe",
  "Conteúdo impróprio",
  "Cobrança indevida",
  "Outro",
] as const;

export const reportSchema = z
  .object({
    targetUserId: z.uuid().optional(),
    targetSessionId: z.uuid().optional(),
    reason: z.enum(REPORT_REASONS, { error: "Escolha um motivo." }),
    details: z
      .string()
      .trim()
      .max(1000, { error: "Use no máximo 1000 caracteres." }),
  })
  .superRefine((r, ctx) => {
    if (!r.targetUserId && !r.targetSessionId) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Não sabemos o que está sendo denunciado." });
    }
    if (r.reason === "Outro" && r.details.length < 10) {
      ctx.addIssue({ code: "custom", path: ["details"], message: "Conte em poucas palavras o que aconteceu." });
    }
  });

export type ReportInput = z.input<typeof reportSchema>;
