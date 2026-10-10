/** Data de hoje em Curitiba, no formato "AAAA-MM-DD" (o servidor da Vercel roda em UTC). */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // O locale en-CA formata datas como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

/**
 * A pessoa já fez 18 anos em `today`? Datas no formato "AAAA-MM-DD".
 * Compara como texto: "2008-05-10" faz 18 anos em "2026-05-10".
 * Quem nasceu em 29/02 completa 18 anos em 01/03, igual à regra do banco (check_adult).
 */
export function isAdult(birthDate: string, today: string = todayInSaoPaulo()): boolean {
  const year = Number(birthDate.slice(0, 4));
  const eighteenth = `${year + 18}${birthDate.slice(4)}`;
  return eighteenth <= today;
}
