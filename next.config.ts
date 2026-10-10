import type { NextConfig } from "next";

// Cache Components fica desligado: todas as páginas leem a sessão do Supabase a cada
// requisição, e o modelo dinâmico é mais simples de explicar (ver DECISIONS.md).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
