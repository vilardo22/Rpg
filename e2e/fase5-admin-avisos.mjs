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
const P = {};
for (const k of ["admin", "aria", "bruno", "duda", "enzo"]) P[k] = await session(k + "@demo.quadro.dev");
const { admin, aria, bruno, duda, enzo } = P;
const toast = async (p) => (await p.locator("[data-sonner-toast]").last().textContent({ timeout: 10000 }))?.trim() ?? "";
const profileId = async (p) => { await p.goto(B + "/perfil", { waitUntil: "networkidle" }); return p.url().split("/").pop(); };
const xpOf = async (p, id) => { await p.goto(B + "/perfil/" + id, { waitUntil: "networkidle" }); return Number((await p.getByRole("heading", { name: /XP$/ }).innerText()).replace(/\D/g, "")); };
const ids = {}; for (const k of Object.keys(P)) ids[k] = await profileId(P[k]);

// 1. Acesso ao admin
await enzo.goto(B + "/admin", { waitUntil: "networkidle" });
ok(await enzo.getByRole("heading", { name: "Página não encontrada" }).isVisible(), "não-admin em /admin recebe 404 em português");
ok((await enzo.getByRole("link", { name: "Admin" }).count()) === 0, "não-admin não vê o link Admin");
await admin.goto(B + "/missoes", { waitUntil: "networkidle" });
ok(await admin.getByRole("link", { name: "Admin" }).isVisible(), "admin vê o link Admin no cabeçalho");

// 2. Denunciar perfil
async function report(p, url, reason, details = "") {
  await p.goto(url, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Denunciar/ }).click();
  const dlg = p.getByRole("dialog");
  if (reason) await dlg.getByLabel("Motivo").selectOption(reason);
  if (details) await dlg.getByLabel("Detalhes (opcional)").fill(details);
  await dlg.getByRole("button", { name: "Enviar denúncia" }).click();
}
await report(enzo, B + "/perfil/" + ids.bruno, null);
ok(await enzo.getByRole("dialog").getByText("Escolha um motivo.").isVisible(), "denúncia sem motivo mostra erro");
await enzo.getByRole("dialog").getByLabel("Motivo").selectOption("Comportamento ofensivo ou assédio");
await enzo.getByRole("dialog").getByRole("button", { name: "Enviar denúncia" }).click();
ok((await toast(enzo)).includes("Denúncia enviada"), "denúncia de perfil enviada");
await report(enzo, B + "/perfil/" + ids.bruno, "Perfil falso ou golpe");
await enzo.getByRole("dialog").getByText(/já tem uma denúncia aberta/).waitFor({ timeout: 10000 }).then(() => ok(true, "segunda denúncia aberta sobre o mesmo perfil é barrada"), () => ok(false, "denúncia repetida"));
await enzo.goto(B + "/perfil/" + ids.enzo, { waitUntil: "networkidle" });
ok((await enzo.getByRole("button", { name: /Denunciar/ }).count()) === 0, "sem botão de denunciar no próprio perfil");

// 3. Denunciar missão (Enzo, que não é o mestre)
await enzo.goto(B + "/missoes", { waitUntil: "networkidle" });
await enzo.getByRole("link", { name: /Maldição de Strahd/ }).click();
await enzo.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname));
const strahdUrl = enzo.url();
await report(enzo, strahdUrl, "Cobrança indevida", "Pediram pix antecipado (teste)");
ok((await toast(enzo)).includes("Denúncia enviada"), "denúncia de missão enviada");
await aria.goto(strahdUrl, { waitUntil: "networkidle" });
ok((await aria.getByRole("button", { name: /Denunciar/ }).count()) === 0, "mestre não vê 'denunciar' na própria missão");

// 4. Selo "Em análise": Duda com 3 denúncias abertas (Celi no seed + Enzo + Aria) pede vaga na mesa do Bruno
await report(enzo, B + "/perfil/" + ids.duda, "Não compareceu ou sumiu");
await toast(enzo);
await report(aria, B + "/perfil/" + ids.duda, "Não compareceu ou sumiu");
await toast(aria);
await duda.goto(B + "/missoes", { waitUntil: "networkidle" });
await duda.getByRole("link", { name: /Tormenta20 para iniciantes/ }).click();
await duda.getByRole("button", { name: "Pedir para entrar" }).click();
await duda.getByText("Pedido enviado. Aguardando o mestre.").waitFor();
await bruno.goto(duda.url(), { waitUntil: "networkidle" });
ok(await bruno.getByText("Em análise").isVisible(), "mestre vê selo 'Em análise' no pedido de quem tem 3+ denúncias");
await bruno.screenshot({ path: OUT + "/f5-em-analise.png", fullPage: true });

// 5. Painel admin: locais
await admin.goto(B + "/admin", { waitUntil: "networkidle" });
ok(await admin.getByText("Café Meeple").isVisible(), "admin vê local pendente");
await admin.screenshot({ path: OUT + "/f5-admin-locais.png", fullPage: true });
await admin.getByRole("button", { name: "Aprovar" }).click();
ok((await toast(admin)).includes("Local aprovado"), "admin aprova o local");
await enzo.goto(B + "/locais", { waitUntil: "networkidle" });
ok(await enzo.getByRole("heading", { name: /Café Meeple/ }).isVisible(), "local aprovado aparece para todos");

// 6. Painel admin: denúncias
const bruno0 = await xpOf(admin, ids.bruno);
await admin.goto(B + "/admin?aba=denuncias", { waitUntil: "networkidle" });
ok((await admin.getByRole("button", { name: "Confirmar (−30 XP)" }).count()) === 5, "admin vê as 5 denúncias abertas");
await admin.screenshot({ path: OUT + "/f5-admin-denuncias.png", fullPage: true });
await admin.locator("li", { hasText: "Comportamento ofensivo ou assédio" }).getByRole("button", { name: "Confirmar (−30 XP)" }).click();
ok((await toast(admin)).includes("confirmada"), "admin confirma denúncia");
const bruno1 = await xpOf(admin, ids.bruno);
ok(bruno1 === Math.max(0, bruno0 - 30), `denunciado perde 30 XP (${bruno0} → ${bruno1})`);
await admin.goto(B + "/admin?aba=denuncias", { waitUntil: "networkidle" });
await admin.locator("li", { hasText: "Cobrança indevida" }).getByRole("button", { name: "Descartar" }).click();
ok((await toast(admin)).includes("descartada"), "admin descarta denúncia");
await admin.getByRole("heading", { name: "Revisadas recentemente" }).waitFor();
ok((await admin.getByText("Confirmada").count()) >= 1 && (await admin.getByText("Descartada").count()) >= 1, "revisadas aparecem com o status");

// 7. Usuários (somente leitura) sem dados privados
await admin.goto(B + "/admin?aba=usuarios", { waitUntil: "networkidle" });
ok(await admin.locator("li", { hasText: "Duda Tabuleira" }).getByText("3 denúncias abertas").isVisible(), "lista de usuários mostra denúncias abertas");
const html = await admin.content();
ok(!html.includes("10020030240") && !html.includes("1994-07-02"), "lista de usuários não expõe CPF/nascimento");

// 8. Não-admin não abre o painel por nenhuma aba
await enzo.goto(B + "/admin?aba=denuncias", { waitUntil: "networkidle" });
ok(await enzo.getByRole("heading", { name: "Página não encontrada" }).isVisible(), "não-admin não abre a aba de denúncias");

// 9. Notificações
await aria.goto(B + "/missoes", { waitUntil: "networkidle" });
const badge = aria.locator('nav[aria-label="Navegação principal"] a[href="/notificacoes"]');
const badgeText = await badge.innerText();
ok(/\d/.test(badgeText), "contador de avisos na navegação: " + badgeText.replace(/\s+/g, " "));
await aria.goto(B + "/notificacoes", { waitUntil: "networkidle" });
await aria.screenshot({ path: OUT + "/f5-avisos.png", fullPage: true });
const unreadBefore = await aria.getByText("Não lido:").count();
ok(unreadBefore > 0, `avisos não lidos destacados (${unreadBefore})`);
await aria.getByRole("button", { name: /Novo pedido de entrada/ }).first().click();
await aria.waitForURL((u) => /^\/missoes\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 10000 }).then(() => ok(true, "tocar no aviso abre a missão"), () => ok(false, "aviso abre a missão"));
await aria.goto(B + "/notificacoes", { waitUntil: "networkidle" });
ok((await aria.getByText("Não lido:").count()) === unreadBefore - 1, "aviso aberto fica como lido");
await aria.getByRole("button", { name: "Marcar todos como lidos" }).click();
await aria.getByRole("button", { name: "Marcar todos como lidos" }).waitFor({ state: "detached", timeout: 10000 });
ok((await aria.getByText("Não lido:").count()) === 0, "marcar todos como lidos");
ok(!/\d/.test(await badge.innerText()), "contador some da navegação");
await browser.close();
