import type { MissionInput } from "@/lib/validation/mission";
import type { MissionDetail } from "./queries";

/**
 * "Criar a próxima" das missões semanais (RF-03): copia os dados da missão
 * concluída para o formulário, com a data uma semana depois. É manual (o mestre
 * revisa e publica); não há nada rodando sozinho em segundo plano.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Partes de data/hora de um instante no horário de Curitiba: { date: "2026-10-17", time: "19:00" }. */
export function saoPauloParts(iso: string | Date): { date: string; time: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return { date, time };
}

/**
 * Mesma hora, 7 dias depois. Se o mestre só concluir semanas depois, pula para a
 * primeira semana que ainda está no futuro.
 */
export function nextWeeklyStart(startsAt: string, now: Date = new Date()): string {
  let next = new Date(startsAt).getTime() + WEEK_MS;
  while (next <= now.getTime()) next += WEEK_MS;
  return new Date(next).toISOString();
}

/** O link de contato salvo vira de novo os campos do formulário. */
function contactFields(url: string | null | undefined) {
  if (url?.startsWith("https://wa.me/55")) {
    return { contactType: "whatsapp" as const, contactPhone: url.slice("https://wa.me/55".length), contactDiscord: "" };
  }
  return { contactType: "discord" as const, contactPhone: "", contactDiscord: url ?? "" };
}

/** Valores iniciais do formulário a partir de uma missão existente. */
export function missionToFormDefaults(mission: MissionDetail, now: Date = new Date()): MissionInput {
  const { date, time } = saoPauloParts(nextWeeklyStart(mission.starts_at, now));
  return {
    title: mission.title,
    gameType: mission.game_type,
    systemName: mission.system_name ?? "",
    kind: mission.kind,
    mode: mission.mode,
    date,
    time,
    durationMinutes: String(mission.duration_minutes),
    maxPlayers: String(mission.max_players),
    recurrence: mission.recurrence,
    minLevel: String(mission.min_level),
    description: mission.description ?? "",
    isPaid: mission.is_paid,
    price: mission.price_cents != null ? (mission.price_cents / 100).toFixed(2).replace(".", ",") : "",
    venueId: mission.venue?.id ?? "",
    onlineUrl: mission.contacts?.online_url ?? "",
    ...contactFields(mission.contacts?.contact_url),
  };
}
