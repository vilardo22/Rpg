import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { cpfCheckDigits } from "@/lib/cpf";

const root = join(__dirname, "..");

/**
 * Cria um Postgres em memória com o "mini Supabase" (supabase-stub.sql) e
 * aplica TODAS as migrations na ordem, exatamente como no projeto real.
 */
export async function createTestDb(): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(readFileSync(join(__dirname, "supabase-stub.sql"), "utf8"));
  const dir = join(root, "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  return db;
}

/** Roda SQL como superusuário (ignora RLS), para preparar os cenários. */
export async function asSystem<T = Record<string, unknown>>(
  db: PGlite,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  await setClaims(db, null);
  return (await db.query<T>(sql, params)).rows;
}

/**
 * Roda SQL como um usuário logado (papel "authenticated", com auth.uid() = userId),
 * ou como visitante anônimo quando userId é null. É assim que o app acessa o banco.
 */
export async function asUser<T = Record<string, unknown>>(
  db: PGlite,
  userId: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  await setClaims(db, userId);
  await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}

async function setClaims(db: PGlite, userId: string | null) {
  await db.query(
    "select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false)",
    [userId ?? "", userId ? "authenticated" : ""],
  );
}

let cpfCounter = 100_000_000;

/** Gera um CPF válido diferente a cada chamada. */
export function nextCpf(): string {
  const base = String(cpfCounter++).padStart(9, "0");
  return base + cpfCheckDigits(base);
}

/**
 * Simula o cadastro: cria o usuário em auth.users (o gatilho cria perfil e
 * estatísticas) e grava os dados privados. Devolve o id.
 */
export async function createUser(
  db: PGlite,
  name: string,
  opts: { admin?: boolean; birthDate?: string } = {},
): Promise<string> {
  const [{ id }] = await asSystem<{ id: string }>(
    db,
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [`${name.toLowerCase().replace(/\W/g, "")}-${cpfCounter}@teste.dev`, { display_name: name }],
  );
  await asSystem(db, "insert into public.private_profiles (user_id, cpf, birth_date) values ($1, $2, $3)", [
    id,
    nextCpf(),
    opts.birthDate ?? "1995-05-20",
  ]);
  if (opts.admin) {
    await asSystem(db, "update public.profiles set role = 'admin' where id = $1", [id]);
  }
  return id;
}

/** Cria um local já verificado e devolve o id. */
export async function createVenue(db: PGlite, verified = true): Promise<string> {
  const [{ id }] = await asSystem<{ id: string }>(
    db,
    `insert into public.venues (name, address, lat, lng, is_verified)
     values ('Local de teste', 'Rua Teste, 1', -25.43, -49.27, $1) returning id`,
    [verified],
  );
  return id;
}

/** Cria uma missão online diretamente (ignora RLS). startsInHours < 0 = já começou. */
export async function createSession(
  db: PGlite,
  hostId: string,
  opts: { maxPlayers?: number; startsInHours?: number; kind?: "mesa" | "torneio"; minLevel?: number } = {},
): Promise<string> {
  const [{ id }] = await asSystem<{ id: string }>(
    db,
    `insert into public.sessions (host_id, title, game_type, mode, starts_at, max_players, kind, min_level)
     values ($1, 'Missão de teste', 'rpg', 'online', now() + make_interval(hours => $2), $3, $4, $5)
     returning id`,
    [hostId, opts.startsInHours ?? 48, opts.maxPlayers ?? 4, opts.kind ?? "mesa", opts.minLevel ?? 1],
  );
  await asSystem(db, "insert into public.session_contacts (session_id, contact_url) values ($1, $2)", [
    id,
    "https://wa.me/5541999999999",
  ]);
  return id;
}

/** Coloca um jogador como aprovado direto (atalho para montar cenários). */
export async function addApproved(db: PGlite, sessionId: string, userId: string) {
  await asSystem(
    db,
    "insert into public.session_participants (session_id, user_id, status) values ($1, $2, 'approved')",
    [sessionId, userId],
  );
}

export async function stats(db: PGlite, userId: string) {
  const [row] = await asSystem<{
    xp: number;
    level: number;
    sessions_played: number;
    sessions_hosted: number;
    no_shows: number;
  }>(db, "select xp, level, sessions_played, sessions_hosted, no_shows from public.player_stats where user_id = $1", [
    userId,
  ]);
  return row;
}
