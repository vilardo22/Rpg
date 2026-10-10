/** Links externos de um local: rota no mapa e Instagram. */

/** Abre a rota até o local no app de mapas do celular (Google Maps). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Aceita "@joyjoycafe", "joyjoycafe", "instagram.com/joyjoycafe" ou a URL completa e devolve a URL do perfil.
 * Valor que não parece um usuário do Instagram → null (não mostra o link).
 */
export function instagramUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const handle = value
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  return /^[\w.]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}/` : null;
}
