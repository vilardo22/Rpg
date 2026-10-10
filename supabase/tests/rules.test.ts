/**
 * Testes das regras de negócio que rodam no banco: vagas, entrada na missão,
 * conclusão com XP/nível (RF-05) e denúncias com o selo "Em análise" (RF-06).
 */
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { addApproved, asSystem, asUser, createSession, createTestDb, createUser, stats } from "./db";

let db: PGlite;
beforeAll(async () => {
  db = await createTestDb();
});

const status = async (session: string, user: string) =>
  (await asSystem<{ status: string }>(
    db, "select status from public.session_participants where session_id = $1 and user_id = $2", [session, user],
  ))[0]?.status;

describe("pedir para entrar (request_join / respond_join / cancel_participation)", () => {
  it("fluxo completo: pedir → aprovar → cancelar → pedir de novo", async () => {
    const host = await createUser(db, "Mestre Ana");
    const player = await createUser(db, "Jogador Bia");
    const session = await createSession(db, host);

    await asUser(db, player, "select public.request_join($1)", [session]);
    expect(await status(session, player)).toBe("pending");

    await asUser(db, host, "select public.respond_join($1, $2, true)", [session, player]);
    expect(await status(session, player)).toBe("approved");

    await asUser(db, player, "select public.cancel_participation($1)", [session]);
    expect(await status(session, player)).toBe("cancelled");

    await asUser(db, player, "select public.request_join($1)", [session]);
    expect(await status(session, player)).toBe("pending");
  });

  it("o mestre não pede entrada na própria missão", async () => {
    const host = await createUser(db, "Mestre Caio");
    const session = await createSession(db, host);
    await expect(asUser(db, host, "select public.request_join($1)", [session])).rejects.toThrow(/mestre/);
  });

  it("não dá para pedir duas vezes", async () => {
    const host = await createUser(db, "Mestre Davi");
    const player = await createUser(db, "Jogadora Eva");
    const session = await createSession(db, host);
    await asUser(db, player, "select public.request_join($1)", [session]);
    await expect(asUser(db, player, "select public.request_join($1)", [session])).rejects.toThrow(/já pediu/);
  });

  it("não é possível aprovar além do limite de vagas", async () => {
    const host = await createUser(db, "Mestre Fabio");
    const session = await createSession(db, host, { maxPlayers: 2 });
    const players = await Promise.all(["P1", "P2", "P3"].map((n) => createUser(db, `Vagas ${n}`)));
    for (const p of players) await asUser(db, p, "select public.request_join($1)", [session]);

    await asUser(db, host, "select public.respond_join($1, $2, true)", [session, players[0]]);
    await asUser(db, host, "select public.respond_join($1, $2, true)", [session, players[1]]);
    await expect(
      asUser(db, host, "select public.respond_join($1, $2, true)", [session, players[2]]),
    ).rejects.toThrow(/vagas/);
    expect(await status(session, players[2])).toBe("pending");
  });

  it("só o mestre responde aos pedidos", async () => {
    const host = await createUser(db, "Mestre Gil");
    const player = await createUser(db, "Jogador Hel");
    const intruso = await createUser(db, "Intruso Ivo");
    const session = await createSession(db, host);
    await asUser(db, player, "select public.request_join($1)", [session]);
    await expect(
      asUser(db, intruso, "select public.respond_join($1, $2, true)", [session, player]),
    ).rejects.toThrow(/Só o mestre/);
  });

  it("nível abaixo do recomendado gera aviso, mas o pedido é criado", async () => {
    const host = await createUser(db, "Mestre Jade");
    const novato = await createUser(db, "Novato Kai");
    const session = await createSession(db, host, { minLevel: 3 });
    const [row] = await asUser<{ request_join: { below_min_level: boolean } }>(
      db, novato, "select public.request_join($1)", [session],
    );
    expect(row.request_join.below_min_level).toBe(true);
    expect(await status(session, novato)).toBe("pending");
  });

  it("o mestre é avisado do pedido e o jogador da aprovação", async () => {
    const host = await createUser(db, "Mestre Lia");
    const player = await createUser(db, "Jogador Max");
    const session = await createSession(db, host);
    await asUser(db, player, "select public.request_join($1)", [session]);
    await asUser(db, host, "select public.respond_join($1, $2, true)", [session, player]);

    const types = async (user: string) =>
      (await asUser<{ type: string }>(db, user, "select type from public.notifications")).map((n) => n.type);
    expect(await types(host)).toContain("join_requested");
    expect(await types(player)).toContain("join_approved");
  });
});

describe("concluir missão e ranking (complete_session, RF-05)", () => {
  it("3 presentes e 1 faltoso: XP, contadores e histórico corretos", async () => {
    const host = await createUser(db, "Mestre Nara");
    const presentes = await Promise.all(["A", "B", "C"].map((n) => createUser(db, `Presente ${n}`)));
    const faltoso = await createUser(db, "Faltoso D");
    const session = await createSession(db, host, { startsInHours: -3 });
    for (const p of [...presentes, faltoso]) await addApproved(db, session, p);
    // O faltoso começa com 20 XP para conferir o −15.
    await asSystem(db, "update public.player_stats set xp = 20 where user_id = $1", [faltoso]);

    await asUser(db, host, "select public.complete_session($1, $2)", [session, presentes]);

    for (const p of presentes) {
      expect(await stats(db, p)).toMatchObject({ xp: 10, level: 1, sessions_played: 1, no_shows: 0 });
    }
    expect(await stats(db, faltoso)).toMatchObject({ xp: 5, sessions_played: 0, no_shows: 1 });
    expect(await stats(db, host)).toMatchObject({ xp: 15, sessions_hosted: 1 });

    const events = await asSystem(db, "select count(*)::int as n from public.reputation_events where session_id = $1", [session]);
    expect(events[0]).toEqual({ n: 5 });
    const [s] = await asSystem(db, "select status from public.sessions where id = $1", [session]);
    expect(s).toEqual({ status: "completed" });
  });

  it("torneio vale +20 para quem compareceu", async () => {
    const host = await createUser(db, "Organizador Otto");
    const player = await createUser(db, "Duelista Pam");
    const session = await createSession(db, host, { startsInHours: -1, kind: "torneio" });
    await addApproved(db, session, player);
    await asUser(db, host, "select public.complete_session($1, $2)", [session, [player]]);
    expect((await stats(db, player)).xp).toBe(20);
  });

  it("XP nunca fica negativo", async () => {
    const host = await createUser(db, "Mestre Quel");
    const faltoso = await createUser(db, "Sumido Rui");
    const session = await createSession(db, host, { startsInHours: -1 });
    await addApproved(db, session, faltoso);
    await asUser(db, host, "select public.complete_session($1, $2)", [session, []]);
    expect(await stats(db, faltoso)).toMatchObject({ xp: 0, no_shows: 1 });
  });

  it("o nível sobe ao cruzar 50 XP (Aventureiro)", async () => {
    const host = await createUser(db, "Mestre Sol");
    const player = await createUser(db, "Quase Ted");
    await asSystem(db, "update public.player_stats set xp = 45 where user_id = $1", [player]);
    const session = await createSession(db, host, { startsInHours: -1 });
    await addApproved(db, session, player);
    await asUser(db, host, "select public.complete_session($1, $2)", [session, [player]]);
    expect(await stats(db, player)).toMatchObject({ xp: 55, level: 2 });
  });

  it("quem não é o mestre não consegue concluir", async () => {
    const host = await createUser(db, "Mestre Uma");
    const player = await createUser(db, "Espertinho Vic");
    const session = await createSession(db, host, { startsInHours: -1 });
    await addApproved(db, session, player);
    await expect(
      asUser(db, player, "select public.complete_session($1, $2)", [session, [player]]),
    ).rejects.toThrow(/Só o mestre/);
    expect((await stats(db, player)).xp).toBe(0);
  });

  it("não conclui antes do horário, nem duas vezes", async () => {
    const host = await createUser(db, "Mestre Wil");
    const futura = await createSession(db, host, { startsInHours: 5 });
    await expect(asUser(db, host, "select public.complete_session($1, '{}')", [futura])).rejects.toThrow(/horário de início/);

    const passada = await createSession(db, host, { startsInHours: -1 });
    await asUser(db, host, "select public.complete_session($1, '{}')", [passada]);
    await expect(asUser(db, host, "select public.complete_session($1, '{}')", [passada])).rejects.toThrow(/encerrada/);
  });

  it("presença só pode ser marcada para participantes aprovados", async () => {
    const host = await createUser(db, "Mestre Xavi");
    const penetra = await createUser(db, "Penetra Yuri");
    const session = await createSession(db, host, { startsInHours: -1 });
    await expect(
      asUser(db, host, "select public.complete_session($1, $2)", [session, [penetra]]),
    ).rejects.toThrow(/participante aprovado/);
  });
});

describe("denúncias e selo 'Em análise' (RF-06)", () => {
  it("3 denúncias abertas de pessoas diferentes ativam o selo", async () => {
    const alvo = await createUser(db, "Alvo Zoe");
    const autores = await Promise.all(["1", "2", "3"].map((n) => createUser(db, `Denunciante ${n}`)));
    const flag = async () =>
      (await asUser<{ f: boolean }>(db, autores[0], "select public.is_under_review($1) as f", [alvo]))[0].f;

    await asUser(db, autores[0], "select public.submit_report($1, null, 'Assédio', null)", [alvo]);
    await asUser(db, autores[1], "select public.submit_report($1, null, 'Assédio', null)", [alvo]);
    expect(await flag()).toBe(false);
    await asUser(db, autores[2], "select public.submit_report($1, null, 'Assédio', null)", [alvo]);
    expect(await flag()).toBe(true);
  });

  it("a mesma pessoa não abre duas denúncias sobre o mesmo alvo", async () => {
    const alvo = await createUser(db, "Alvo Ana");
    const autor = await createUser(db, "Insistente Beto");
    await asUser(db, autor, "select public.submit_report($1, null, 'Spam', null)", [alvo]);
    await expect(
      asUser(db, autor, "select public.submit_report($1, null, 'Spam', null)", [alvo]),
    ).rejects.toThrow(/já tem uma denúncia/);
  });

  it("admin confirma denúncia (−30 XP); usuário comum não pode revisar", async () => {
    const admin = await createUser(db, "Admin Cid", { admin: true });
    const alvo = await createUser(db, "Alvo Dora");
    const autor = await createUser(db, "Autor Ema");
    await asSystem(db, "update public.player_stats set xp = 100, level = 2 where user_id = $1", [alvo]);
    const [{ id }] = await asUser<{ id: string }>(
      db, autor, "select public.submit_report($1, null, 'Comportamento', 'Ofendeu a mesa') as id", [alvo],
    );

    await expect(asUser(db, autor, "select public.review_report($1, true)", [id])).rejects.toThrow(/administradores/);
    await asUser(db, admin, "select public.review_report($1, true)", [id]);
    expect(await stats(db, alvo)).toMatchObject({ xp: 70, level: 2 });
  });
});
