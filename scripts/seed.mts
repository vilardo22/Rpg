/**
 * Dados de demonstração (PRD seção 9): 1 admin, 5 jogadores fictícios, locais,
 * missões futuras, uma missão em andamento (para demonstrar a conclusão) e uma já
 * concluída gerando histórico de XP.
 *
 * Uso:  npm run seed
 * Pode rodar quantas vezes quiser: antes de criar, apaga só o que o próprio seed
 * criou (usuários @demo.quadro.dev e os locais da lista abaixo). Dados reais não são tocados.
 *
 * Usa a SECRET KEY do .env.local. Os pedidos de entrada e a conclusão da missão passam
 * pelas mesmas funções (RPC) que o app usa, logado como cada usuário.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) {
  throw new Error("Preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY no .env.local.");
}

const DEMO_DOMAIN = "@demo.quadro.dev";
const PASSWORD = "Missoes2026!";
const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Lança erro com contexto se a chamada ao Supabase falhar. */
function check<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as NonNullable<R["data"]>;
}

/** CPF válido (Módulo 11) a partir de 9 dígitos. Só para dados fictícios. */
function fakeCpf(base: string): string {
  const digit = (digits: number[]) => {
    const sum = digits.reduce((total, d, i) => total + d * (digits.length + 1 - i), 0);
    return ((sum * 10) % 11) % 10;
  };
  const nums = base.split("").map(Number);
  const first = digit(nums);
  return base + first + digit([...nums, first]);
}

/** Data/hora em Curitiba (UTC−3, sem horário de verão desde 2019). */
function at(daysFromNow: number, hour: number, minute = 0): string {
  const now = new Date();
  const sp = new Date(now.getTime() - 3 * 60 * 60 * 1000); // "agora" em Curitiba
  sp.setUTCDate(sp.getUTCDate() + daysFromNow);
  const date = sp.toISOString().slice(0, 10);
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`;
}

/** Cliente "logado" como um usuário de demonstração, para chamar as RPCs como o app. */
async function clientAs(email: string): Promise<SupabaseClient> {
  const client = createClient(url!, publishableKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  check(await client.auth.signInWithPassword({ email, password: PASSWORD }), `login ${email}`);
  return client;
}

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const USERS = [
  { key: "admin", name: "Admin do Quadro", cpf: "100200301", birth: "1990-03-15", admin: true },
  { key: "aria", name: "Aria Pena-de-Corvo", cpf: "100200302", birth: "1994-07-02", xp: 320, played: 18, hosted: 9, interests: ["rpg"], availability: [5, 6] },
  { key: "bruno", name: "Bruno Dadoverde", cpf: "100200303", birth: "1998-11-20", xp: 160, played: 12, hosted: 3, interests: ["rpg", "boardgame"], availability: [3, 6] },
  { key: "celi", name: "Celi Cartamestra", cpf: "100200304", birth: "2000-01-09", xp: 75, played: 6, hosted: 2, interests: ["tcg"], availability: [0, 6] },
  { key: "duda", name: "Duda Tabuleira", cpf: "100200305", birth: "1996-05-30", xp: 40, played: 4, hosted: 1, interests: ["boardgame"], availability: [2, 4, 6] },
  { key: "enzo", name: "Enzo Novato", cpf: "100200306", birth: "2003-09-12", xp: 0, played: 0, hosted: 0, interests: ["rpg", "tcg"], availability: [1, 3, 5] },
] as const;
type UserKey = (typeof USERS)[number]["key"];

const VENUES = [
  {
    key: "joyjoy",
    // TODO: confirmar endereço e coordenadas reais com o Arthur (PRD RF-04).
    name: "Joy Joy Café",
    address: "Endereço a confirmar — próximo ao Jardim Botânico",
    lat: -25.4425,
    lng: -49.2395,
    description: "Café indicado pelo parceiro do projeto. Mesas para RPG e jogos de tabuleiro.",
    game_types: ["rpg", "boardgame"],
    is_verified: true,
  },
  {
    key: "taverna",
    name: "Taverna do Dado (exemplo)",
    address: "Rua XV de Novembro, 1000 — Centro (fictício)",
    lat: -25.4295,
    lng: -49.2713,
    description: "Local de EXEMPLO para a demonstração.",
    game_types: ["boardgame", "rpg"],
    is_verified: true,
  },
  {
    key: "cartaalta",
    name: "Loja Carta Alta (exemplo)",
    address: "Av. do Batel, 500 — Batel (fictício)",
    lat: -25.4417,
    lng: -49.2881,
    description: "Loja de TCG de EXEMPLO para a demonstração.",
    game_types: ["tcg"],
    is_verified: true,
  },
  {
    key: "meeple",
    name: "Café Meeple (exemplo, aguardando aprovação)",
    address: "Rua Fictícia, 42 — Água Verde",
    lat: -25.4505,
    lng: -49.2795,
    description: "Sugestão de local para demonstrar a aprovação no painel admin.",
    game_types: ["boardgame"],
    is_verified: false,
    suggestedBy: "duda" as UserKey,
  },
] as const;
type VenueKey = (typeof VENUES)[number]["key"];

// ---------------------------------------------------------------------------
// 1. Limpa o que um seed anterior criou
// ---------------------------------------------------------------------------

async function reset() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const demoIds = (data?.users ?? []).filter((u) => u.email?.endsWith(DEMO_DOMAIN)).map((u) => u.id);

  if (demoIds.length) {
    // Missões dos usuários demo primeiro (a FK de host_id não apaga em cascata).
    check(await admin.from("sessions").delete().in("host_id", demoIds), "apagar missões demo");
  }
  check(await admin.from("venues").delete().in("name", VENUES.map((v) => v.name)), "apagar locais demo");
  for (const id of demoIds) {
    check(await admin.auth.admin.deleteUser(id), "apagar usuário demo");
  }
  console.log(`Limpeza: ${demoIds.length} usuários de demonstração removidos.`);
}

// ---------------------------------------------------------------------------
// 2. Cria tudo
// ---------------------------------------------------------------------------

async function seed() {
  const ids = {} as Record<UserKey, string>;
  const emails = {} as Record<UserKey, string>;

  for (const u of USERS) {
    const email = `${u.key}${DEMO_DOMAIN}`;
    const created = check(
      await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: u.name },
      }),
      `criar ${email}`,
    );
    const id = created.user?.id;
    if (!id) throw new Error(`criar ${email}: usuário não retornado`);
    ids[u.key] = id;
    emails[u.key] = email;

    check(
      await admin.from("private_profiles").insert({ user_id: id, cpf: fakeCpf(u.cpf), birth_date: u.birth }),
      `dados privados ${email}`,
    );
    if ("admin" in u) {
      check(await admin.from("profiles").update({ role: "admin" }).eq("id", id), "promover admin");
    }
    if ("xp" in u) {
      check(
        await admin.from("profiles").update({
          bio: "Perfil fictício de demonstração.",
          interests: u.interests,
          availability: u.availability,
        }).eq("id", id),
        `perfil ${email}`,
      );
      // Histórico anterior resumido: XP e contadores iniciais variados (PRD seção 9).
      const level = u.xp >= 300 ? 4 : u.xp >= 150 ? 3 : u.xp >= 50 ? 2 : 1;
      check(
        await admin.from("player_stats").update({
          xp: u.xp, level, sessions_played: u.played, sessions_hosted: u.hosted,
        }).eq("user_id", id),
        `stats ${email}`,
      );
    }
  }

  const venueIds = {} as Record<VenueKey, string>;
  for (const v of VENUES) {
    const row = check(
      await admin.from("venues").insert({
        name: v.name, address: v.address, lat: v.lat, lng: v.lng, description: v.description,
        game_types: v.game_types, is_verified: v.is_verified,
        suggested_by: "suggestedBy" in v ? ids[v.suggestedBy] : null,
      }).select("id").single(),
      `local ${v.name}`,
    );
    venueIds[v.key] = row.id;
  }

  type NewSession = {
    host: UserKey; title: string; game_type: string; system_name?: string; kind?: string;
    venue?: VenueKey; starts_at: string; max_players: number; recurrence?: string;
    min_level?: number; is_paid?: boolean; price_cents?: number; description: string;
    contact: string; online?: string;
  };

  async function createSession(s: NewSession): Promise<string> {
    const row = check(
      await admin.from("sessions").insert({
        host_id: ids[s.host], title: s.title, game_type: s.game_type, system_name: s.system_name ?? null,
        kind: s.kind ?? "mesa", mode: s.venue ? "presencial" : "online",
        venue_id: s.venue ? venueIds[s.venue] : null, starts_at: s.starts_at, max_players: s.max_players,
        recurrence: s.recurrence ?? "none", min_level: s.min_level ?? 1, is_paid: s.is_paid ?? false,
        price_cents: s.price_cents ?? null, description: s.description,
      }).select("id").single(),
      `missão ${s.title}`,
    );
    check(
      await admin.from("session_contacts").insert({ session_id: row.id, contact_url: s.contact, online_url: s.online ?? null }),
      `contato ${s.title}`,
    );
    return row.id;
  }

  const strahd = await createSession({
    host: "aria", title: "A Maldição de Strahd — sessão 0", game_type: "rpg", system_name: "D&D 5e",
    venue: "joyjoy", starts_at: at(2, 19), max_players: 5, recurrence: "weekly",
    description: "Campanha semanal de terror gótico. Sessão 0 para montar personagens. Iniciantes são bem-vindos!",
    contact: "https://wa.me/5541900000001",
  });
  await createSession({
    host: "duda", title: "Noite de Catan e Carcassonne", game_type: "boardgame", system_name: "Catan, Carcassonne",
    venue: "taverna", starts_at: at(3, 19, 30), max_players: 6,
    description: "Jogos clássicos para uma noite tranquila. Ensinamos as regras na hora.",
    contact: "https://wa.me/5541900000002",
  });
  await createSession({
    host: "celi", title: "Torneio Pokémon TCG — Standard", game_type: "tcg", system_name: "Pokémon TCG",
    kind: "torneio", venue: "cartaalta", starts_at: at(9, 14), max_players: 16, is_paid: true, price_cents: 1500,
    description: "Formato Standard, melhor de 3. Inscrição paga no local (valor só informativo no app).",
    contact: "https://discord.gg/exemplo-carta-alta",
  });
  const cthulhu = await createSession({
    host: "bruno", title: "Call of Cthulhu — one-shot online", game_type: "rpg", system_name: "Call of Cthulhu 7e",
    starts_at: at(4, 20), max_players: 4, min_level: 2,
    description: "Investigação e horror cósmico em uma noite. Recomendado para quem já jogou RPG antes.",
    contact: "https://discord.gg/exemplo-cthulhu", online: "https://discord.gg/exemplo-cthulhu-mesa",
  });
  await createSession({
    host: "celi", title: "Magic Commander casual", game_type: "tcg", system_name: "Magic: The Gathering",
    venue: "cartaalta", starts_at: at(5, 18), max_players: 4,
    description: "Pods de 4 jogadores, decks de qualquer nível de poder. Traga seu deck!",
    contact: "https://wa.me/5541900000003",
  });
  await createSession({
    host: "bruno", title: "Tormenta20 para iniciantes", game_type: "rpg", system_name: "Tormenta20",
    venue: "joyjoy", starts_at: at(6, 15), max_players: 5,
    description: "Mesa de introdução ao RPG nacional. Fichas prontas, só chegar.",
    contact: "https://wa.me/5541900000004",
  });

  // Missão que já começou: para demonstrar "concluir missão" no vídeo (PRD seção 11).
  const ordem = await createSession({
    host: "aria", title: "Ordem Paranormal — capítulo 3", game_type: "rpg", system_name: "Ordem Paranormal",
    starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), max_players: 4, recurrence: "weekly",
    description: "Campanha semanal online. Missão em andamento para demonstrar a conclusão e o \"Criar a próxima\".",
    contact: "https://discord.gg/exemplo-ordem", online: "https://discord.gg/exemplo-ordem-mesa",
  });

  // Missão concluída na semana passada: gera histórico real de XP pelas RPCs.
  const gloom = await createSession({
    host: "duda", title: "Gloomhaven — cenário 1", game_type: "boardgame", system_name: "Gloomhaven",
    venue: "taverna", starts_at: at(-7, 19), max_players: 4,
    description: "Primeiro cenário da campanha cooperativa.",
    contact: "https://wa.me/5541900000005",
  });

  // Participantes de missões passadas/em andamento entram direto (já não aceitam pedidos).
  for (const [session, players] of [[ordem, ["bruno", "enzo", "duda"]], [gloom, ["aria", "enzo", "celi"]]] as const) {
    check(
      await admin.from("session_participants").insert(
        players.map((p) => ({ session_id: session, user_id: ids[p], status: "approved" })),
      ),
      "participantes",
    );
  }

  // Pedidos em missões futuras, pelo mesmo caminho do app (RPC logado como cada um).
  const as = {} as Record<UserKey, SupabaseClient>;
  for (const u of USERS) as[u.key] = await clientAs(emails[u.key]);

  check(await as.celi.rpc("request_join", { p_session_id: strahd }), "Celi pede Strahd");
  check(await as.aria.rpc("respond_join", { p_session_id: strahd, p_user_id: ids.celi, p_approve: true }), "Aria aprova Celi");
  check(await as.enzo.rpc("request_join", { p_session_id: strahd }), "Enzo pede Strahd");
  check(await as.duda.rpc("request_join", { p_session_id: cthulhu }), "Duda pede Cthulhu");

  // Duda conclui Gloomhaven: Aria e Enzo foram, Celi faltou.
  check(
    await as.duda.rpc("complete_session", { p_session_id: gloom, p_attended_user_ids: [ids.aria, ids.enzo] }),
    "concluir Gloomhaven",
  );

  // Uma denúncia aberta, para o painel admin ter o que revisar na demonstração.
  check(
    await as.celi.rpc("submit_report", {
      p_target_user_id: ids.duda,
      p_target_session_id: null,
      p_reason: "Não compareceu ou sumiu",
      p_details: "Confirmou presença no Gloomhaven e não apareceu nem avisou. (dado fictício)",
    }),
    "denúncia demo",
  );

  console.log("\nSeed concluído. Contas de demonstração (senha para todas: " + PASSWORD + "):");
  for (const u of USERS) console.log(`  ${emails[u.key].padEnd(28)} ${u.name}${"admin" in u ? "  [admin]" : ""}`);
}

await reset();
await seed();
