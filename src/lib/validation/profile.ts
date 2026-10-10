import { z } from "zod";
import { GAME_TYPES } from "@/lib/missions/labels";

/** Dias da semana como no banco: 0 = domingo ... 6 = sábado. */
export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/**
 * Formulário "Editar perfil" (RF-02). Checkboxes chegam como lista de textos
 * ("0", "6"...), que o schema converte para números.
 */
export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: "O nome precisa ter pelo menos 2 letras." })
    .max(40, { error: "Use no máximo 40 caracteres." }),
  bio: z
    .string()
    .trim()
    .max(280, { error: "Use no máximo 280 caracteres." })
    .transform((v) => v || null),
  interests: z.array(z.enum(GAME_TYPES)),
  availability: z
    .array(z.string().regex(/^[0-6]$/))
    .transform((days) => [...new Set(days.map(Number))].sort()),
  /** Experiência autodeclarada: só preferência de filtro; o nível oficial vem do XP. */
  experienceLevel: z
    .string()
    .regex(/^[1-4]?$/)
    .transform((v) => (v ? Number(v) : null)),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;
