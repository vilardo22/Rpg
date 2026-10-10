import type { MetadataRoute } from "next";

// Manifesto PWA: permite "Adicionar à tela inicial" no celular. Sem service worker (PRD seção 3).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quadro de Missões",
    short_name: "Missões",
    description: "Encontre mesas de RPG, jogos de tabuleiro e TCG em Curitiba.",
    lang: "pt-BR",
    start_url: "/missoes",
    display: "standalone",
    background_color: "#F4E9D8",
    theme_color: "#2D1B4E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
