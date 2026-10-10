/**
 * Formatação para a interface (pt-BR, horário de Curitiba).
 * O servidor da Vercel roda em UTC: por isso todo Intl recebe timeZone explícito.
 */
const TIME_ZONE = "America/Sao_Paulo";

const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const longFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** "sáb., 11 de out. · 19:00" (cartões da lista). */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return `${dayFormat.format(date)} · ${timeFormat.format(date)}`;
}

/** "sábado, 11 de outubro às 19:00" (detalhe da missão). */
export function formatSessionDateLong(iso: string): string {
  return longFormat.format(new Date(iso));
}

/** 180 → "3h"; 90 → "1h30". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** 1500 → "R$ 15,00". */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Data e hora digitadas em Curitiba → instante ISO. "2026-10-11" + "19:00" → "2026-10-11T19:00:00-03:00". */
export function toSaoPauloIso(date: string, time: string): string {
  // Curitiba não tem horário de verão desde 2019: o fuso é sempre UTC−3.
  return `${date}T${time}:00-03:00`;
}
