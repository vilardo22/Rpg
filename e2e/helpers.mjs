/**
 * Utilitários dos testes de ponta a ponta (navegador de verdade, contas de demonstração).
 * Não rode estes arquivos diretamente: use `npm run e2e` (veja e2e/README.md).
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";

/** Endereço do app testado: o local (npm run dev) ou o publicado na Vercel. */
export const B = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Pasta das capturas de tela (ignorada pelo git). */
export const OUT = join(dirname(fileURLToPath(import.meta.url)), "capturas");
mkdirSync(OUT, { recursive: true });

let failures = 0;

/** Registra uma checagem: "OK" ou "FALHA" + descrição. */
export function ok(condition, message) {
  if (!condition) failures++;
  console.log((condition ? "OK   " : "FALHA") + " " + message);
}

// Termina com código de erro se alguma checagem falhou (o run-all.mjs usa isso).
process.on("exit", (code) => {
  if (code === 0 && failures > 0) process.exitCode = 1;
});

/** Abre o navegador sem janela. Usa o Edge (vem no Windows); E2E_BROWSER=chrome para usar o Chrome. */
export function launchBrowser() {
  return chromium.launch({ channel: process.env.E2E_BROWSER ?? "msedge" });
}

/** Ids do Joy Joy Café e do local pendente do seed (para os testes de locais). */
export async function venueIds() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin.from("venues").select("id, name, is_verified");
  if (error) throw new Error("Não consegui ler os locais: " + error.message);
  return {
    joy: data.find((v) => v.name === "Joy Joy Café")?.id,
    pending: data.find((v) => !v.is_verified)?.id,
  };
}
