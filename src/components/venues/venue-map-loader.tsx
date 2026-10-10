"use client";

import dynamic from "next/dynamic";

/**
 * O Leaflet usa `window`, que não existe no servidor. Por isso o mapa é carregado
 * só no navegador (ssr: false); enquanto isso aparece um bloco cinza do mesmo tamanho.
 * No App Router, `ssr: false` só pode ser usado dentro de um Client Component como este.
 */
export const VenueMap = dynamic(() => import("./venue-map"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[320px] animate-pulse rounded-xl border bg-secondary"
      aria-label="Carregando mapa"
      aria-busy="true"
    />
  ),
});
