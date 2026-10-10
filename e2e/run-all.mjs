/**
 * Roda todos os testes de ponta a ponta, na ordem, recriando os dados de
 * demonstração (seed) onde é preciso. Uso (veja e2e/README.md):
 *
 *   npm run e2e                                  → testa http://localhost:3000
 *   npm run e2e -- https://rpg-nine-olive.vercel.app   → testa o site publicado
 *   npm run e2e -- http://localhost:3000 fase2   → só os testes cujo nome contém "fase2"
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const [baseUrl, only] = process.argv.slice(2);
const env = { ...process.env, E2E_BASE_URL: baseUrl ?? process.env.E2E_BASE_URL ?? "http://localhost:3000" };

// "seed" = recriar os dados de demonstração antes deste teste.
// A fase 4 conclui a missão em andamento e a fase 5 conta as denúncias do seed:
// as duas precisam de dados limpos.
const plan = [
  { file: "fase1-cadastro.mjs", seed: true },
  { file: "fase4-perfil-xp.mjs", seed: true },
  { file: "fase3-locais.mjs", seed: false },
  { file: "fase2-missoes.mjs", seed: false },
  { file: "fase5-admin-avisos.mjs", seed: true },
  { file: "fase6-home.mjs", seed: false },
].filter((step) => !only || step.file.includes(only));

function seed() {
  const r = spawnSync(process.execPath, ["scripts/seed.mts"], { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error("O seed falhou: confira o .env.local.");
  }
}

console.log(`Testando ${env.E2E_BASE_URL}\n`);
const results = [];
for (const step of plan) {
  if (step.seed) seed();
  console.log(`── ${step.file}`);
  const r = spawnSync(process.execPath, [join(here, step.file)], { cwd: root, env, stdio: "inherit" });
  results.push({ file: step.file, passed: r.status === 0 });
}
seed(); // deixa o banco com os dados de demonstração limpos no final

console.log("\nResumo:");
for (const r of results) console.log(`  ${r.passed ? "OK   " : "FALHA"} ${r.file}`);
console.log(`\nCapturas de tela em e2e/capturas/`);
if (results.some((r) => !r.passed)) process.exitCode = 1;
