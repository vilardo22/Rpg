// Gera os ícones PNG do PWA a partir de src/app/icon.svg.
// Uso: node scripts/generate-icons.mjs  (rode de novo se mudar o SVG)
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("src/app/icon.svg");

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}

// Ícone "maskable": o Android recorta as bordas, então o desenho fica em 80% do quadro
// sobre um fundo roxo cheio (área segura).
const inner = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#2D1B4E" },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icons/icon-maskable-512.png");

await sharp(svg).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("Ícones gerados em public/icons e src/app/apple-icon.png");
