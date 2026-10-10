import { z } from "zod";
import { onlyDigits } from "@/lib/cpf";
import { toSaoPauloIso } from "@/lib/format";
import { GAME_TYPES, RECURRENCES, SESSION_KINDS, SESSION_MODES } from "@/lib/missions/labels";

/**
 * Formulário "Criar missão" (RF-03). Os campos chegam como texto (vindos dos inputs)
 * e o schema converte para números/datas. Regras que dependem de mais de um campo
 * (presencial exige local, online exige link...) ficam no superRefine no fim.
 */

/** Texto que vira inteiro dentro de um intervalo. */
const intBetween = (min: number, max: number, message: string) =>
  z.string().transform(Number).pipe(z.number({ error: message }).int({ error: message }).min(min, { error: message }).max(max, { error: message }));

const optionalText = (max: number) =>
  z.string().trim().max(max, { error: `Use no máximo ${max} caracteres.` }).transform((v) => v || undefined);

export const CONTACT_TYPES = ["whatsapp", "discord"] as const;

const DISCORD_URL = /^https:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/[\w-]+\/?$/i;

export const missionSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Dê um título com pelo menos 3 letras." }).max(80, { error: "Use no máximo 80 caracteres." }),
    gameType: z.enum(GAME_TYPES, { error: "Escolha o tipo de jogo." }),
    systemName: optionalText(60),
    kind: z.enum(SESSION_KINDS),
    mode: z.enum(SESSION_MODES),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Escolha a data." }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { error: "Escolha o horário." }),
    durationMinutes: intBetween(30, 1440, "Escolha a duração."),
    maxPlayers: intBetween(2, 20, "As vagas vão de 2 a 20 jogadores."),
    recurrence: z.enum(RECURRENCES),
    minLevel: intBetween(1, 4, "Escolha o nível recomendado."),
    description: optionalText(2000),
    isPaid: z.boolean(),
    price: z.string().trim(),
    venueId: z.string(),
    onlineUrl: z.string().trim(),
    contactType: z.enum(CONTACT_TYPES),
    contactPhone: z.string(),
    contactDiscord: z.string().trim(),
  })
  .superRefine((m, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    const startsAt = Date.parse(toSaoPauloIso(m.date, m.time));
    if (!Number.isNaN(startsAt)) {
      if (startsAt <= Date.now()) issue("date", "A missão precisa ser no futuro.");
      else if (startsAt > Date.now() + 365 * 24 * 60 * 60 * 1000) issue("date", "Marque a missão para os próximos 12 meses.");
    }

    // Presencial só em local verificado (o banco confere de novo); online precisa do link da sala.
    if (m.mode === "presencial" && !m.venueId) issue("venueId", "Escolha o local da missão.");
    if (m.mode === "online" && !/^https:\/\/\S+$/.test(m.onlineUrl)) {
      issue("onlineUrl", "Cole o link da sala (Discord, Meet...), começando com https://.");
    }

    if (m.isPaid && !(parsePriceCents(m.price) > 0)) issue("price", "Informe o valor por pessoa, ex.: 15,00.");

    if (m.contactType === "whatsapp" && !/^\d{10,11}$/.test(onlyDigits(m.contactPhone))) {
      issue("contactPhone", "WhatsApp com DDD, ex.: (41) 99999-9999.");
    }
    if (m.contactType === "discord" && !DISCORD_URL.test(m.contactDiscord)) {
      issue("contactDiscord", "Cole um convite do Discord, ex.: https://discord.gg/abc123.");
    }
  });

export type MissionInput = z.input<typeof missionSchema>;
export type MissionData = z.output<typeof missionSchema>;

/** "15,50" ou "15.50" → 1550 centavos. Texto inválido → NaN. */
export function parsePriceCents(value: string): number {
  const normalized = value.replace(/\s|R\$/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100);
}

/** Link de contato revelado aos aprovados: WhatsApp vira https://wa.me/55DDDNUMERO. */
export function buildContactUrl(m: Pick<MissionData, "contactType" | "contactPhone" | "contactDiscord">): string {
  return m.contactType === "whatsapp" ? `https://wa.me/55${onlyDigits(m.contactPhone)}` : m.contactDiscord;
}

/** Converte o formulário validado nas linhas das tabelas sessions e session_contacts. */
export function toMissionRows(m: MissionData, hostId: string) {
  return {
    session: {
      host_id: hostId,
      title: m.title,
      game_type: m.gameType,
      system_name: m.systemName ?? null,
      kind: m.kind,
      mode: m.mode,
      venue_id: m.mode === "presencial" ? m.venueId : null,
      starts_at: toSaoPauloIso(m.date, m.time),
      duration_minutes: m.durationMinutes,
      max_players: m.maxPlayers,
      recurrence: m.recurrence,
      min_level: m.minLevel,
      description: m.description ?? null,
      is_paid: m.isPaid,
      price_cents: m.isPaid ? parsePriceCents(m.price) : null,
    },
    contacts: {
      contact_url: buildContactUrl(m),
      online_url: m.mode === "online" ? m.onlineUrl : null,
    },
  };
}
