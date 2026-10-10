/**
 * Testes de segurança do banco: cadastro, dados privados (LGPD) e RLS.
 * Cada teste cria seus próprios usuários, então todos compartilham um banco só.
 */
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  addApproved,
  asSystem,
  asUser,
  createSession,
  createTestDb,
  createUser,
  createVenue,
  nextCpf,
} from "./db";

let db: PGlite;
beforeAll(async () => {
  db = await createTestDb();
});

describe("cadastro (RF-01)", () => {
  it("criar usuário no Auth cria o perfil e as estatísticas zeradas", async () => {
    const id = await createUser(db, "Bruna");
    const [profile] = await asSystem(db, "select display_name, role from public.profiles where id = $1", [id]);
    expect(profile).toEqual({ display_name: "Bruna", role: "user" });
    const [s] = await asSystem(db, "select xp, level from public.player_stats where user_id = $1", [id]);
    expect(s).toEqual({ xp: 0, level: 1 });
  });

  it("o banco recusa CPF inválido, mesmo que o app deixe passar", async () => {
    const id = await createUser(db, "Caio");
    await asSystem(db, "delete from public.private_profiles where user_id = $1", [id]);
    await expect(
      asSystem(db, "insert into public.private_profiles (user_id, cpf, birth_date) values ($1, '11111111111', '1990-01-01')", [id]),
    ).rejects.toThrow(/is_valid_cpf|check/i);
  });

  it("o banco recusa CPF repetido", async () => {
    const cpf = nextCpf();
    const a = await createUser(db, "Duda");
    const b = await createUser(db, "Edu");
    await asSystem(db, "update public.private_profiles set cpf = $2 where user_id = $1", [a, cpf]);
    await expect(
      asSystem(db, "update public.private_profiles set cpf = $2 where user_id = $1", [b, cpf]),
    ).rejects.toThrow(/unique|duplicate/i);
  });

  it("o banco recusa menores de 18 anos", async () => {
    const lastYear = new Date().getFullYear() - 1;
    await expect(createUser(db, "Fefe", { birthDate: `${lastYear}-01-01` })).rejects.toThrow(/18 anos/);
  });
});

describe("dados privados e perfil (RF-02)", () => {
  it("ninguém lê o CPF, nascimento ou telefone de outra pessoa", async () => {
    const dono = await createUser(db, "Gabi");
    const outro = await createUser(db, "Hugo");
    expect(await asUser(db, outro, "select * from public.private_profiles where user_id = $1", [dono])).toEqual([]);
    expect(await asUser(db, dono, "select cpf from public.private_profiles where user_id = $1", [dono])).toHaveLength(1);
  });

  it("visitante sem login não lê nenhuma tabela", async () => {
    await expect(asUser(db, null, "select * from public.profiles")).rejects.toThrow(/permission denied/);
    await expect(asUser(db, null, "select * from public.private_profiles")).rejects.toThrow(/permission denied/);
  });

  it("o usuário não consegue se promover a admin", async () => {
    const id = await createUser(db, "Iara");
    await expect(
      asUser(db, id, "update public.profiles set role = 'admin' where id = $1", [id]),
    ).rejects.toThrow(/permission denied/);
  });

  it("o usuário não consegue trocar o próprio CPF depois do cadastro", async () => {
    const id = await createUser(db, "Juca");
    await expect(
      asUser(db, id, "update public.private_profiles set cpf = $2 where user_id = $1", [id, nextCpf()]),
    ).rejects.toThrow(/permission denied/);
  });

  it("o usuário edita o próprio perfil, mas não o de outra pessoa", async () => {
    const a = await createUser(db, "Kika");
    const b = await createUser(db, "Leo");
    await asUser(db, a, "update public.profiles set bio = 'Jogo D&D' where id = $1", [a]);
    await asUser(db, a, "update public.profiles set bio = 'invadido' where id = $1", [b]);
    const rows = await asSystem<{ id: string; bio: string | null }>(
      db, "select id, bio from public.profiles where id = any($1)", [[a, b]],
    );
    expect(rows.find((r) => r.id === a)?.bio).toBe("Jogo D&D");
    expect(rows.find((r) => r.id === b)?.bio).toBeNull();
  });
});

describe("reputação é escrita só pelo servidor (RF-05)", () => {
  it("o cliente não consegue alterar o próprio XP nem criar eventos de reputação", async () => {
    const id = await createUser(db, "Malu");
    await expect(
      asUser(db, id, "update public.player_stats set xp = 9999 where user_id = $1", [id]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, id, "insert into public.reputation_events (user_id, kind, points) values ($1, 'hosted', 500)", [id]),
    ).rejects.toThrow(/permission denied/);
  });

  it("o cliente não consegue chamar as funções internas de XP", async () => {
    const id = await createUser(db, "Nina");
    await expect(
      asUser(db, id, "select public.apply_reputation($1, 'hosted', null)", [id]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("locais (RF-04)", () => {
  it("local não verificado não aparece para os outros", async () => {
    const pendente = await createVenue(db, false);
    const user = await createUser(db, "Otto");
    expect(await asUser(db, user, "select id from public.venues where id = $1", [pendente])).toEqual([]);
  });

  it("sugestão de local nasce não verificada e não pode se autoaprovar", async () => {
    const user = await createUser(db, "Pietra");
    await expect(
      asUser(db, user,
        `insert into public.venues (name, address, lat, lng, suggested_by, is_verified)
         values ('Meu café', 'Rua X', -25.4, -49.2, $1, true)`, [user]),
    ).rejects.toThrow(/row-level security/);

    const [v] = await asUser<{ id: string }>(db, user,
      `insert into public.venues (name, address, lat, lng, suggested_by)
       values ('Meu café', 'Rua X', -25.4, -49.2, $1) returning id`, [user]);
    await expect(asUser(db, user, "select public.approve_venue($1, true)", [v.id])).rejects.toThrow(/administradores/);
  });

  it("admin aprova o local", async () => {
    const admin = await createUser(db, "Admin Quinn", { admin: true });
    const venue = await createVenue(db, false);
    await asUser(db, admin, "select public.approve_venue($1, true)", [venue]);
    const [v] = await asSystem(db, "select is_verified from public.venues where id = $1", [venue]);
    expect(v).toEqual({ is_verified: true });
  });
});

describe("missões (RF-03)", () => {
  it("missão presencial só em local verificado", async () => {
    const host = await createUser(db, "Rafa");
    const naoVerificado = await createVenue(db, false);
    const verificado = await createVenue(db, true);
    const insert = `insert into public.sessions (host_id, venue_id, title, game_type, mode, starts_at, max_players)
                    values ($1, $2, 'Mesa de sábado', 'rpg', 'presencial', now() + interval '2 days', 4)`;
    await expect(asUser(db, host, insert, [host, naoVerificado])).rejects.toThrow(/locais verificados/);
    await expect(asUser(db, host, insert, [host, verificado])).resolves.toBeDefined();
  });

  it("não dá para criar missão no passado nem em nome de outra pessoa", async () => {
    const host = await createUser(db, "Sara");
    const outro = await createUser(db, "Tito");
    const insert = `insert into public.sessions (host_id, title, game_type, mode, starts_at, max_players)
                    values ($1, 'Online', 'tcg', 'online', now() + $2::interval, 4)`;
    await expect(asUser(db, host, insert, [host, "-1 hour"])).rejects.toThrow(/futuro/);
    await expect(asUser(db, host, insert, [outro, "1 day"])).rejects.toThrow(/row-level security/);
  });

  it("o mestre não consegue mudar o status direto (só pelas funções)", async () => {
    const host = await createUser(db, "Ugo");
    const session = await createSession(db, host);
    await expect(
      asUser(db, host, "update public.sessions set status = 'completed' where id = $1", [session]),
    ).rejects.toThrow(/permission denied/);
  });

  it("link de contato só para o mestre e participantes aprovados", async () => {
    const host = await createUser(db, "Vera");
    const aprovado = await createUser(db, "Wagner");
    const pendente = await createUser(db, "Xuxa");
    const estranho = await createUser(db, "Yago");
    const session = await createSession(db, host);
    await addApproved(db, session, aprovado);
    await asUser(db, pendente, "select public.request_join($1)", [session]);

    const contato = (user: string) =>
      asUser(db, user, "select contact_url from public.session_contacts where session_id = $1", [session]);
    expect(await contato(host)).toHaveLength(1);
    expect(await contato(aprovado)).toHaveLength(1);
    expect(await contato(pendente)).toEqual([]);
    expect(await contato(estranho)).toEqual([]);
  });

  it("pedidos pendentes só aparecem para o próprio jogador e para o mestre", async () => {
    const host = await createUser(db, "Zeca");
    const jogador = await createUser(db, "Alice");
    const curioso = await createUser(db, "Beto");
    const session = await createSession(db, host);
    await asUser(db, jogador, "select public.request_join($1)", [session]);

    const pedidos = (user: string) =>
      asUser(db, user, "select user_id from public.session_participants where session_id = $1", [session]);
    expect(await pedidos(host)).toHaveLength(1);
    expect(await pedidos(jogador)).toHaveLength(1);
    expect(await pedidos(curioso)).toEqual([]);
  });
});

describe("denúncias (RF-06)", () => {
  it("o usuário vê só as próprias denúncias e não altera o status", async () => {
    const alvo = await createUser(db, "Cris");
    const autor = await createUser(db, "Dani");
    const outro = await createUser(db, "Enzo");
    await asUser(db, autor, "select public.submit_report($1, null, 'Comportamento', null)", [alvo]);

    expect(await asUser(db, autor, "select id from public.reports where target_user_id = $1", [alvo])).toHaveLength(1);
    expect(await asUser(db, outro, "select id from public.reports where target_user_id = $1", [alvo])).toEqual([]);
    await expect(
      asUser(db, autor, "update public.reports set status = 'confirmed' where target_user_id = $1", [alvo]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("notificações (RF-07)", () => {
  it("cada um vê e marca como lidas só as próprias; não dá para alterar o texto", async () => {
    const host = await createUser(db, "Fabi");
    const player = await createUser(db, "Gui");
    const session = await createSession(db, host);
    await asUser(db, player, "select public.request_join($1)", [session]);

    const [notif] = await asUser<{ id: string }>(db, host, "select id from public.notifications");
    expect(notif).toBeDefined();
    expect(await asUser(db, player, "select id from public.notifications where id = $1", [notif.id])).toEqual([]);

    await asUser(db, player, "update public.notifications set read_at = now() where id = $1", [notif.id]);
    const [stillUnread] = await asSystem(db, "select read_at from public.notifications where id = $1", [notif.id]);
    expect(stillUnread).toEqual({ read_at: null });

    await asUser(db, host, "update public.notifications set read_at = now() where id = $1", [notif.id]);
    const [read] = await asSystem<{ read_at: string | null }>(db, "select read_at from public.notifications where id = $1", [notif.id]);
    expect(read.read_at).not.toBeNull();

    await expect(
      asUser(db, host, "update public.notifications set title = 'hack' where id = $1", [notif.id]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, host, "insert into public.notifications (user_id, type, title) values ($1, 'x', 'falsa')", [player]),
    ).rejects.toThrow(/permission denied/);
  });
});
