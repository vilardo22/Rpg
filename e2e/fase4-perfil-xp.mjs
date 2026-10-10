import { B, OUT, launchBrowser, ok } from "./helpers.mjs";
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
const pages = {};
for (const k of ["aria", "bruno", "enzo", "duda"]) pages[k] = await session(k + "@demo.quadro.dev");
const { aria, enzo } = pages;

// Ids e XP inicial: "Perfil" na navegação leva ao próprio perfil
const ids = {}, xp0 = {}, faltas0 = {};
async function readProfile(p) {
  await p.goto(B + "/perfil", { waitUntil: "networkidle" });
  const xp = Number((await p.getByRole("heading", { name: /XP$/ }).innerText()).replace(/\D/g, ""));
  const faltas = Number(await p.locator("text=Faltas").locator("xpath=preceding-sibling::p[1]").innerText());
  return { id: p.url().split("/").pop(), xp, faltas };
}
for (const k of Object.keys(pages)) { const r = await readProfile(pages[k]); ids[k] = r.id; xp0[k] = r.xp; faltas0[k] = r.faltas; }
ok(Object.values(ids).every((id) => /^[0-9a-f-]{36}$/.test(id)), "/perfil redireciona para o próprio perfil");

// Missão em andamento pela aba Minhas
await aria.goto(B + "/missoes?aba=minhas", { waitUntil: "networkidle" });
ok(await aria.getByText("Em andamento").first().isVisible(), "aba Minhas mostra a missão em andamento");
await aria.getByRole("link", { name: /Ordem Paranormal/ }).click();
await aria.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname));
const missionUrl = aria.url();
await enzo.goto(missionUrl, { waitUntil: "networkidle" });
ok((await enzo.getByRole("heading", { name: "Concluir missão" }).count()) === 0, "jogador não vê 'Concluir missão'");

// Mestre conclui: Duda faltou
await aria.getByRole("heading", { name: "Concluir missão" }).waitFor();
await aria.getByRole("checkbox", { name: /Duda Tabuleira/ }).uncheck();
ok(await aria.getByText("falta · −15 XP").isVisible(), "desmarcar mostra a falta e o −15");
await aria.screenshot({ path: OUT + "/f4-concluir.png", fullPage: true });
await aria.getByRole("button", { name: "Concluir missão" }).click();
ok((await aria.getByRole("alertdialog").innerText()).includes("Falta para: Duda Tabuleira"), "confirmação lista quem faltou");
await aria.getByRole("alertdialog").getByRole("button", { name: "Concluir" }).click();
await aria.getByText("Missão concluída. O XP dos participantes já foi atualizado.").waitFor({ timeout: 15000 });
ok(true, "missão concluída");
ok((await aria.getByText("Compareceu").count()) === 2 && (await aria.getByText("Faltou").count()) === 1, "presenças marcadas (2 compareceram, 1 faltou)");
await aria.screenshot({ path: OUT + "/f4-concluida.png", fullPage: true });

// XP depois
const expected = { aria: 15, bruno: 10, enzo: 10, duda: -15 };
for (const k of Object.keys(pages)) {
  const r = await readProfile(pages[k]);
  const want = Math.max(0, xp0[k] + expected[k]);
  ok(r.xp === want, `${k}: XP ${xp0[k]} → ${r.xp} (esperado ${want})`);
  if (k === "duda") ok(r.faltas === faltas0.duda + 1, `duda: faltas ${faltas0.duda} → ${r.faltas}`);
}
await enzo.goto(B + "/perfil", { waitUntil: "networkidle" });
ok(await enzo.getByText(/Jogou · Ordem Paranormal/).isVisible(), "histórico do jogador mostra a missão");
await enzo.screenshot({ path: OUT + "/f4-perfil.png", fullPage: true });

// Criar a próxima (missão semanal)
await aria.goto(missionUrl, { waitUntil: "networkidle" });
await aria.getByRole("link", { name: "Criar a próxima" }).click();
await aria.waitForURL((u) => u.pathname === "/missoes/nova");
await aria.getByRole("heading", { name: "Criar a próxima" }).waitFor();
const title = await aria.getByLabel("Título").inputValue();
const date = await aria.getByLabel("Data").inputValue();
const inWeek = new Date(Date.now() + 7 * 864e5 - 3 * 3600e3).toISOString().slice(0, 10);
ok(title === "Ordem Paranormal — capítulo 3", "título copiado");
ok(date === inWeek || date === new Date(Date.now() + 6 * 864e5 - 3 * 3600e3).toISOString().slice(0, 10), `data +7 dias (${date})`);
ok((await aria.getByLabel("Convite do Discord").inputValue()).startsWith("https://discord.gg/"), "contato do Discord copiado");
await aria.getByRole("button", { name: "Publicar missão" }).click();
await aria.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 15000 });
ok(aria.url() !== missionUrl, "próxima missão publicada");

// Outro usuário não consegue copiar a missão de alguém
await enzo.goto(B + "/missoes/nova?copiar=" + missionUrl.split("/").pop(), { waitUntil: "networkidle" });
ok((await enzo.getByLabel("Título").inputValue()) === "", "não-mestre não copia a missão de outra pessoa");

// Editar perfil
await enzo.goto(B + "/perfil/editar", { waitUntil: "networkidle" });
await enzo.getByLabel("Sobre você (opcional)").fill("Comecei a jogar este ano!");
await enzo.locator("input[name=interests][value=boardgame]").check({ force: true });
await enzo.locator('input[name=availability][value="6"]').check({ force: true });
await enzo.getByLabel("Sua experiência").selectOption("2");
await enzo.getByRole("button", { name: "Salvar" }).click();
await enzo.getByRole("link", { name: "Editar perfil" }).waitFor({ timeout: 15000 });
await enzo.getByText("Comecei a jogar este ano!").waitFor();
const body = await enzo.locator("main").innerText();
ok(body.includes("Comecei a jogar este ano!") && body.includes("Tabuleiro") && body.includes("Sáb"), "perfil editado aparece no perfil público");
await enzo.goto(B + "/missoes", { waitUntil: "networkidle" });
await enzo.getByRole("link", { name: /Mostrar só missões para o meu nível \(2/ }).click();
await enzo.waitForURL((u) => u.searchParams.get("nivel") === "2").then(() => ok(true, "atalho de filtro pelo nível declarado"), () => ok(false, "atalho de nível"));

// Privacidade: perfil de outra pessoa sem CPF/nascimento
await enzo.goto(B + "/perfil/" + ids.aria, { waitUntil: "networkidle" });
const html = await enzo.content();
ok(!html.includes("10020030240") && !html.includes("1994-07-02") && !html.includes("100.200.302-40"), "perfil de outra pessoa não contém CPF nem nascimento");
ok((await enzo.getByRole("link", { name: "Editar perfil" }).count()) === 0, "sem 'Editar perfil' no perfil dos outros");
await browser.close();
