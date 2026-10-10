import { B, OUT, launchBrowser, ok, venueIds } from "./helpers.mjs";
const { joy: JOY, pending: PEND } = await venueIds();
const browser = await launchBrowser();
async function session(email) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(B + "/entrar", { waitUntil: "networkidle" });
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Missoes2026!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname === "/missoes");
  return page;
}
const enzo = await session("enzo@demo.quadro.dev");
const errors = [];
enzo.on("pageerror", (e) => errors.push(e.message));
enzo.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await enzo.goto(B + "/locais", { waitUntil: "networkidle" });
await enzo.locator(".leaflet-container").waitFor({ timeout: 15000 });
await enzo.locator(".leaflet-tile-loaded").first().waitFor({ timeout: 15000 }).then(() => ok(true, "mapa carregou os tiles do OpenStreetMap"), () => ok(false, "tiles do mapa"));
ok((await enzo.locator(".leaflet-marker-icon").count()) === 3, "3 pinos (só locais verificados)");
ok(!(await enzo.getByText("Café Meeple").isVisible()), "local pendente fora da lista");
await enzo.screenshot({ path: OUT + "/f3-locais.png" });
await enzo.locator('.leaflet-marker-icon[title="Joy Joy Café"]').click();
await enzo.locator(".leaflet-popup").waitFor();
await enzo.waitForTimeout(600);
const popup = await enzo.locator(".leaflet-popup").innerText();
ok(popup.includes("Joy Joy Café") && popup.includes("Maldição de Strahd"), "balão do pino mostra local e missões");
await enzo.screenshot({ path: OUT + "/f3-popup.png" });
await enzo.locator(".leaflet-popup").getByRole("link", { name: "Ver local" }).click();
await enzo.waitForURL((u) => u.pathname === "/locais/" + JOY);
ok(true, "link 'Ver local' abre a página do local");
await enzo.getByRole("heading", { name: "Missões agendadas" }).waitFor();
ok(await enzo.getByText("Tormenta20 para iniciantes").isVisible(), "página do local lista as missões futuras");
ok((await enzo.getByRole("link", { name: /Como chegar/ }).getAttribute("href"))?.includes("destination=-25.4425,-49.2395"), "botão Como chegar com as coordenadas");
await enzo.screenshot({ path: OUT + "/f3-local.png", fullPage: true });

// Rolar com o mapa na tela: o cabeçalho continua por cima do mapa
await enzo.goto(B + "/locais", { waitUntil: "networkidle" });
await enzo.locator(".leaflet-tile-loaded").first().waitFor();
await enzo.mouse.wheel(0, 250);
await enzo.waitForTimeout(400);
const topEl = await enzo.evaluate(() => document.elementFromPoint(100, 20)?.closest("header") != null);
ok(topEl, "cabeçalho fica por cima do mapa ao rolar");
const navEl = await enzo.evaluate(() => document.elementFromPoint(100, window.innerHeight - 20)?.closest("nav") != null);
ok(navEl, "navegação inferior fica por cima do mapa");

// Pendente: Enzo não vê; quem sugeriu (Duda) vê com aviso
await enzo.goto(B + "/locais/" + PEND, { waitUntil: "networkidle" });
ok(await enzo.getByText("Local não encontrado").isVisible(), "pendente: outro usuário recebe 'não encontrado'");
const duda = await session("duda@demo.quadro.dev");
await duda.goto(B + "/locais/" + PEND, { waitUntil: "networkidle" });
ok(await duda.getByText(/Aguardando verificação/).isVisible(), "pendente: quem sugeriu vê com aviso");

// Formulário não oferece o local pendente
await duda.goto(B + "/missoes/nova", { waitUntil: "networkidle" });
const options = await duda.getByLabel("Local verificado").locator("option").allInnerTexts();
ok(!options.some((o) => o.includes("Meeple")) && options.includes("Joy Joy Café"), "formulário só oferece locais verificados");

// Detalhe da missão linka o local
await enzo.goto(B + "/missoes?local=" + JOY, { waitUntil: "networkidle" });
await enzo.getByRole("link", { name: /Maldição de Strahd/ }).click();
await enzo.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname));
await enzo.getByRole("link", { name: /Joy Joy Café/ }).click();
await enzo.waitForURL((u) => u.pathname === "/locais/" + JOY).then(() => ok(true, "missão → página do local"), () => ok(false, "missão → local"));

ok(errors.length === 0, "sem erros no console" + (errors.length ? ": " + errors.join(" | ") : ""));
await browser.close();
