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
const toastText = async (page) => (await page.locator("[data-sonner-toast]").last().textContent({ timeout: 10000 }))?.trim();
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const aria = await session("aria@demo.quadro.dev");
const enzo = await session("enzo@demo.quadro.dev");
await aria.screenshot({ path: OUT + "/f2-lista.png", fullPage: true });

// 1. Criar missão: validação e criação
await aria.goto(B + "/missoes/nova", { waitUntil: "networkidle" });
await aria.getByRole("button", { name: "Publicar missão" }).click();
ok(await aria.getByText("Dê um título com pelo menos 3 letras.").isVisible(), "formulário vazio mostra erros");
const title = "Teste E2E — Mesa de Tormenta " + Date.now().toString().slice(-4);
await aria.getByLabel("Título").fill(title);
await aria.getByLabel("Sistema ou jogo (opcional)").fill("Tormenta20");
await aria.getByLabel("Data").fill(inDays(5));
await aria.getByLabel("Horário").fill("20:00");
await aria.getByLabel("Local verificado").selectOption({ label: "Joy Joy Café" });
await aria.getByLabel("Jogadores").fill("2");
await aria.getByLabel("Seu WhatsApp").fill("(41) 98888-7777");
await aria.screenshot({ path: OUT + "/f2-form.png", fullPage: true });
await aria.getByRole("button", { name: "Publicar missão" }).click();
await aria.waitForURL(/\/missoes\/[0-9a-f-]{36}/, { timeout: 15000 });
const missionUrl = aria.url().split("?")[0];
await aria.getByRole("heading", { name: title }).waitFor({ timeout: 10000 }).then(() => ok(true, "missão criada abre o detalhe"), () => ok(false, "missão criada abre o detalhe"));
ok(await aria.getByText("Você é o mestre desta missão.").isVisible(), "mestre se reconhece");

// 2. Enzo encontra pela lista filtrada e pede para entrar
await enzo.goto(B + "/missoes?jogo=rpg&local=" + "", { waitUntil: "networkidle" });
await enzo.goto(B + "/missoes?jogo=rpg", { waitUntil: "networkidle" });
ok(await enzo.getByRole("link", { name: new RegExp(title) }).isVisible(), "missão aparece na lista filtrada por RPG");
await enzo.goto(B + "/missoes?jogo=tcg", { waitUntil: "networkidle" });
ok(!(await enzo.getByText(title).isVisible()), "missão some no filtro TCG");
await enzo.goto(missionUrl, { waitUntil: "networkidle" });
ok(!(await enzo.content()).includes("wa.me/5541988887777"), "contato NÃO está no HTML antes da aprovação");
await enzo.getByRole("button", { name: "Pedir para entrar" }).click();
ok((await toastText(enzo))?.includes("Pedido enviado"), "pedido enviado (toast)");
await enzo.getByText("Pedido enviado. Aguardando o mestre.").waitFor();
ok(true, "estado pendente na tela do jogador");

// 3. Aria aprova
await aria.reload({ waitUntil: "networkidle" });
ok(await aria.getByText("Pedidos de entrada (1)").isVisible(), "mestre vê 1 pedido");
await aria.screenshot({ path: OUT + "/f2-mestre.png", fullPage: true });
await aria.getByRole("button", { name: "Aprovar" }).click();
ok((await toastText(aria))?.includes("aprovado"), "aprovação (toast)");
await aria.getByText("Participantes (1/2)").waitFor();
ok(true, "participantes 1/2");

// 4. Enzo vê o contato
await enzo.reload({ waitUntil: "networkidle" });
const href = await enzo.getByRole("link", { name: /Abrir WhatsApp do mestre/ }).getAttribute("href");
ok(href === "https://wa.me/5541988887777", "aprovado vê o link do WhatsApp: " + href);
await enzo.screenshot({ path: OUT + "/f2-aprovado.png", fullPage: true });

// 5. Enzo sai: vaga liberada, contato some
await enzo.getByRole("button", { name: "Sair da missão" }).click();
await enzo.getByRole("button", { name: "Pedir para entrar" }).waitFor({ timeout: 10000 });
ok((await enzo.getByRole("link", { name: /Abrir WhatsApp/ }).count()) === 0, "ao sair, o link de contato some da tela");
await enzo.reload({ waitUntil: "networkidle" });
ok(!(await enzo.content()).includes("wa.me/5541988887777"), "ao sair, o contato não vem mais do servidor (HTML novo)");

// 6. Lotação: Bruno e Celi entram (2 vagas), Enzo pede de novo e o Aprovar fica desabilitado
for (const email of ["bruno@demo.quadro.dev", "celi@demo.quadro.dev"]) {
  const p = await session(email);
  await p.goto(missionUrl, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Pedir para entrar" }).click();
  await p.getByText("Pedido enviado. Aguardando o mestre.").waitFor();
  await p.context().close();
}
await enzo.getByRole("button", { name: "Pedir para entrar" }).click();
await enzo.getByText("Pedido enviado. Aguardando o mestre.").waitFor();
await aria.reload({ waitUntil: "networkidle" });
for (let i = 0; i < 2; i++) {
  await aria.getByRole("button", { name: "Aprovar" }).first().click();
  await aria.getByText(`Participantes (${i + 1}/2)`).waitFor({ timeout: 10000 });
}
ok(await aria.getByRole("button", { name: "Aprovar" }).isDisabled(), "lotada: botão Aprovar desabilitado");
await enzo.goto(B + "/missoes?aba=minhas", { waitUntil: "networkidle" });
ok(await enzo.getByText(title).isVisible(), "aba Minhas mostra a missão pedida");
ok(await enzo.getByText("Lotada").first().isVisible(), "cartão mostra Lotada");

// 7. Cancelar missão
await aria.goto(missionUrl, { waitUntil: "networkidle" });
await aria.getByRole("button", { name: "Cancelar missão" }).click();
await aria.getByRole("alertdialog").getByRole("button", { name: "Cancelar missão" }).click();
await aria.getByText("Esta missão foi cancelada pelo mestre.").waitFor({ timeout: 10000 });
ok(true, "missão cancelada");
await enzo.goto(B + "/missoes", { waitUntil: "networkidle" });
ok(!(await enzo.getByText(title).isVisible()), "cancelada some da lista");

// 8. URL inválida
await enzo.goto(B + "/missoes/nao-existe", { waitUntil: "networkidle" });
ok(await enzo.getByText("Missão não encontrada").isVisible(), "id inválido mostra 'não encontrada'");
console.log("MISSAO " + missionUrl);
await browser.close();
