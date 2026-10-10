import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Crown, Dices, Pencil, Swords, Trophy, UserX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatSessionDate } from "@/lib/format";
import { GAME_TYPE_LABEL } from "@/lib/missions/labels";
import { levelProgress } from "@/lib/profile/levels";
import { getLevels, getProfile, type HistoryItem } from "@/lib/profile/queries";
import { WEEKDAYS } from "@/lib/validation/profile";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/perfil/[id]">): Promise<Metadata> {
  const { id } = await params;
  const profile = UUID.test(id) ? await getProfile(id) : null;
  return { title: profile?.display_name ?? "Perfil" };
}

/** Texto de cada linha do histórico de reputação. */
const HISTORY_LABEL: Record<HistoryItem["kind"], string> = {
  played: "Jogou",
  hosted: "Mestrou",
  tournament: "Torneio",
  no_show: "Faltou",
  report_confirmed: "Denúncia confirmada",
};

function Stat({ icon: Icon, label, value }: { icon: typeof Dices; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <Icon aria-hidden className="mx-auto size-5 text-dourado" />
      <p className="font-heading text-2xl font-semibold text-roxo">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function PerfilPublicoPage({ params }: PageProps<"/perfil/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await requireUser();
  const [profile, levels] = await Promise.all([getProfile(id), getLevels()]);
  if (!profile) notFound();

  const isMe = profile.id === user.id;
  const { stats } = profile;
  const progress = levelProgress(stats.xp, levels);
  const initials = profile.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article className="space-y-5">
      <header className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-roxo font-heading text-2xl font-semibold text-dourado"
        >
          {initials}
        </div>
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl leading-tight font-semibold break-words">{profile.display_name}</h1>
          {/* Selo de reputação: o nível conquistado jogando (RF-02/RF-05). */}
          <Badge className="bg-dourado text-roxo-escuro">
            <Crown aria-hidden /> Nível {progress.level} · {progress.name}
          </Badge>
        </div>
      </header>

      {isMe && (
        <Button asChild variant="outline" className="w-full">
          <Link href="/perfil/editar">
            <Pencil aria-hidden /> Editar perfil
          </Link>
        </Button>
      )}

      {/* Barra de progresso até o próximo nível */}
      <section aria-labelledby="xp" className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 id="xp" className="text-lg font-semibold">
            {stats.xp} XP
          </h2>
          <p className="text-sm text-muted-foreground">
            {progress.nextName ? `faltam ${progress.xpToNext} para ${progress.nextName}` : "nível máximo!"}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={`Progresso até o próximo nível`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          className="h-3 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full rounded-full bg-dourado" style={{ width: `${progress.percent}%` }} />
        </div>
      </section>

      <section aria-label="Estatísticas" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={Dices} label="Jogadas" value={stats.sessions_played} />
        <Stat icon={Swords} label="Mestradas" value={stats.sessions_hosted} />
        <Stat icon={Trophy} label="Torneios" value={profile.tournaments} />
        <Stat icon={UserX} label="Faltas" value={stats.no_shows} />
      </section>

      {(profile.bio || profile.interests.length > 0 || profile.availability.length > 0) && (
        <section aria-labelledby="sobre" className="space-y-3 rounded-xl border bg-card p-4">
          <h2 id="sobre" className="text-lg font-semibold">
            Sobre
          </h2>
          {profile.bio && <p className="whitespace-pre-line">{profile.bio}</p>}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Joga:</span>
              {profile.interests.map((g) => (
                <Badge key={g} className="bg-roxo text-pergaminho">
                  {GAME_TYPE_LABEL[g]}
                </Badge>
              ))}
            </div>
          )}
          {profile.availability.length > 0 && (
            <p className="flex items-center gap-1.5 text-sm">
              <CalendarCheck aria-hidden className="size-4 text-dourado" />
              Disponível: {profile.availability.map((d) => WEEKDAYS[d]).join(", ")}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="historico" className="space-y-3">
        <h2 id="historico" className="text-lg font-semibold">
          Histórico
        </h2>
        {profile.history.length === 0 ? (
          <EmptyState
            title="Nenhuma missão concluída ainda"
            description={isMe ? "Entre numa missão e jogue: o XP aparece aqui quando o mestre concluir." : undefined}
            action={isMe ? { href: "/missoes", label: "Encontrar missão" } : undefined}
          />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {profile.history.map((item) => (
              <li key={item.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {HISTORY_LABEL[item.kind]}
                    {item.session && (
                      <>
                        {" · "}
                        <Link href={`/missoes/${item.session.id}`} className="text-roxo underline-offset-4 hover:underline">
                          {item.session.title}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSessionDate(item.session?.starts_at ?? item.created_at)}
                  </p>
                </div>
                <span
                  className={item.points >= 0 ? "shrink-0 font-semibold text-roxo" : "shrink-0 font-semibold text-destructive"}
                >
                  {item.points >= 0 ? `+${item.points}` : item.points} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
