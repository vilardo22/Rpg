"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { formatSessionDate } from "@/lib/format";
import { GAME_TYPE_LABEL } from "@/lib/missions/labels";
import type { Venue } from "@/lib/venues/queries";

/** Centro de Curitiba, usado quando não há locais para enquadrar. */
const CURITIBA: [number, number] = [-25.4284, -49.2733];

/**
 * Pino desenhado em SVG (roxo com centro dourado). Usar um divIcon evita o problema
 * clássico do Leaflet com bundlers, em que as imagens do pino padrão não carregam.
 */
const pin = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true">
    <path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="#2D1B4E" stroke="#F4E9D8" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="#D4A017"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  popupAnchor: [0, -36],
});

type VenueMapProps = {
  venues: Venue[];
  /** Altura do mapa em pixels. */
  height?: number;
  /** Mostrar o resumo de missões no balão (desligado na página do próprio local). */
  showPopups?: boolean;
};

/**
 * Mapa OpenStreetMap com os locais verificados (RF-04). Ao tocar num pino, um balão
 * mostra nome, endereço, tipos de jogo e as próximas missões do local.
 * Este componente só roda no navegador: veja venue-map-loader.tsx.
 */
export default function VenueMap({ venues, height = 320, showPopups = true }: VenueMapProps) {
  const points = venues.map((v) => [v.lat, v.lng] as [number, number]);
  // Vários locais: enquadra todos. Um local só: centraliza nele.
  const view =
    points.length > 1
      ? { bounds: L.latLngBounds(points), boundsOptions: { padding: [40, 40] as [number, number] } }
      : { center: points[0] ?? CURITIBA, zoom: points.length ? 15 : 12 };

  return (
    // "isolate" cria um contexto de empilhamento: os z-index altos do Leaflet não
    // passam por cima do cabeçalho e da navegação inferior ao rolar a página.
    <div className="isolate overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer {...view} scrollWheelZoom={false} className="h-full w-full" aria-label="Mapa dos locais">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venues.map((venue) => (
          <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={pin} title={venue.name} alt={venue.name}>
            {showPopups && (
              // autoPanPadding: ao abrir, o mapa se move para o balão não ficar sob os botões de zoom.
              <Popup autoPanPadding={[24, 56]}>
                <div className="space-y-1.5 font-sans text-tinta">
                  <p className="font-heading text-base font-semibold text-roxo">{venue.name}</p>
                  <p className="!my-0 text-xs">{venue.address}</p>
                  {venue.game_types.length > 0 && (
                    <p className="!my-0 text-xs">{venue.game_types.map((g) => GAME_TYPE_LABEL[g]).join(" · ")}</p>
                  )}
                  {venue.upcoming.length > 0 ? (
                    <ul className="space-y-0.5 text-xs">
                      {venue.upcoming.slice(0, 3).map((m) => (
                        <li key={m.id}>
                          <Link href={`/missoes/${m.id}`} className="text-roxo underline">
                            {m.title}
                          </Link>{" "}
                          · {formatSessionDate(m.starts_at)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="!my-0 text-xs">Nenhuma missão agendada.</p>
                  )}
                  <Link href={`/locais/${venue.id}`} className="inline-block font-semibold text-roxo underline">
                    Ver local
                  </Link>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
