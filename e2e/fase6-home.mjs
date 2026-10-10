import { B, OUT, launchBrowser, ok } from "./helpers.mjs";
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(B + "/", { waitUntil: "networkidle" });
ok(await page.getByRole("heading", { name: "Próximas missões" }).isVisible(), "home mostra próximas missões");
ok(await page.getByText("Joy Joy Café").first().isVisible(), "home mostra locais parceiros");
const html = await page.content();
ok(!html.includes("wa.me") && !html.includes("discord.gg") && !html.includes("Pena-de-Corvo"), "prévia sem contatos nem nomes de usuários");
ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "sem rolagem horizontal em 390px");
await page.screenshot({ path: OUT + "/f6-home.png", fullPage: true });
await page.getByRole("link", { name: /Strahd/ }).click();
await page.waitForURL((u) => u.pathname === "/entrar");
ok(page.url().includes("next=%2Fmissoes%2F"), "missão da prévia leva ao login e volta para ela");
await page.getByLabel("E-mail", { exact: true }).fill("enzo@demo.quadro.dev");
await page.getByLabel("Senha", { exact: true }).fill("Missoes2026!");
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname)).then(() => ok(true, "após login abre a missão escolhida"), () => ok(false, "volta à missão"));
await page.goto(B + "/", { waitUntil: "networkidle" });
ok(new URL(page.url()).pathname === "/missoes", "logado na home vai para /missoes");
await page.keyboard.press("Tab");
ok((await page.evaluate(() => document.activeElement?.textContent)) === "Pular para o conteúdo", "primeiro Tab mostra 'Pular para o conteúdo'");
await page.screenshot({ path: OUT + "/f6-skip.png" });
// 390px em todas as telas logadas
for (const p of ["/missoes", "/missoes/nova", "/locais", "/perfil", "/perfil/editar", "/notificacoes"]) {
  await page.goto(B + p, { waitUntil: "networkidle" });
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(w <= 390, `${p}: sem rolagem horizontal (largura ${w})`);
}
await browser.close();
