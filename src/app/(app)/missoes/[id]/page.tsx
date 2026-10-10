import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Coins, ExternalLink, Gauge, MessageCircle, Repeat, Video } from "lucide-react";
import { LevelBadge, MissionBadges, MissionPlace, SpotsLeft } from "@/components/missions/mission-meta";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatDuration, formatPrice, formatSessionDateLong } from "@/lib/format";
import { levelName } from "@/lib/missions/labels";
import { getMission, getMyLevel, underReviewUsers } from "@/lib/missions/queries";
import { Badge } from "@/components/ui/badge";
import { CompleteMission } from "./complete-mission";
import { CancelMissionButton, JoinRequests, RemoveParticipantButton } from "./host-actions";
import { JoinActions } from "./join-actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/missoes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const mission = UUID.test(id) ? await getMission(id) : null;
  return { title: mission?.title ?? "Missão" };
}

export default async function MissaoPage({ params }: PageProps<"/missoes/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await requireUser();
  const [mission, myLevel] = await Promise.all([getMission(id), getMyLevel(user.id)]);
  if (!mission) notFound();

  const isHost = mission.host.id === user.id;
  const myStatus = mission.participants.find((p) => p.user_id === user.id)?.status ?? null;
  const approved = mission.participants.filter((p) => p.status === "approved");
  const pending = mission.participants.filter((p) => p.status === "pending");
  const isFull = mission.approvedCount >= mission.max_players;
  const hasStarted = new Date(mission.starts_at) <= new Date();
  const isOpen = mission.status === "open";
  // O selo "Em análise" só é consultado para quem o mestre está avaliando.
  const underReview = isHost ? [...(await underReviewUsers(pending.map((p) => p.user_id)))] : [];

  // O RLS só devolve o contato para o mestre e os aprovados; para os outros vem null.
  const contacts = mission.contacts;
  const isWhatsApp = contacts?.contact_url?.startsWith("https://wa.me/");

  return (
    <article className="space-y-5">
      <Link href="/missoes" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-roxo">
        <ArrowLeft aria-hidden className="size-4" /> Missões
      </Link>

      {mission.status === "cancelled" && (
        <p role="status" className="rounded-lg bg-destructive/10 p-3 font-medium text-destructive">
          Esta missão foi cancelada pelo mestre.
        </p>
      )}
      {mission.status === "completed" && (
        <div role="status" className="space-y-3 rounded-lg bg-secondary p-3">
          <p className="font-medium">Missão concluída. O XP dos participantes já foi atualizado.</p>
          {isHost && mission.recurrence === "weekly" && (
            // Missão semanal: o mestre cria a próxima com um toque (dados copiados, data +7 dias).
            <Button asChild className="w-full">
              <Link href={`/missoes/nova?copiar=${mission.id}`}>
                <Repeat aria-hidden /> Criar a próxima
              </Link>
            </Button>
          )}
        </div>
      )}

      <header className="space-y-2">
        <MissionBadges gameType={mission.game_type} kind={mission.kind} recurrence={mission.recurrence} />
        <h1 className="text-2xl leading-tight font-semibold">{mission.title}</h1>
        {mission.system_name && <p className="text-muted-foreground">{mission.system_name}</p>}
      </header>

      <dl className="grid gap-2.5 rounded-xl border bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-dourado" />
          <dt className="sr-only">Quando</dt>
          <dd className="first-letter:uppercase">
            {formatSessionDateLong(mission.starts_at)}
            {hasStarted && isOpen && <strong> · em andamento</strong>}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock aria-hidden className="size-4 shrink-0 text-dourado" />
          <dt className="sr-only">Duração</dt>
          <dd>{formatDuration(mission.duration_minutes)}</dd>
        </div>
        <div>
          <dt className="sr-only">Onde</dt>
          <dd>
            {mission.venue ? (
              <Link href={`/locais/${mission.venue.id}`} className="underline-offset-4 hover:underline">
                <MissionPlace mode={mission.mode} venueName={mission.venue.name} />
                <span className="block pl-5.5 text-muted-foreground">{mission.venue.address}</span>
              </Link>
            ) : (
              <MissionPlace mode={mission.mode} />
            )}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Vagas</dt>
          <dd>
            <SpotsLeft approved={mission.approvedCount} max={mission.max_players} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Gauge aria-hidden className="size-4 shrink-0 text-dourado" />
          <dt className="sr-only">Nível recomendado</dt>
          <dd>
            {mission.min_level > 1
              ? `Recomendado: nível ${mission.min_level} (${levelName(mission.min_level)}) ou mais`
              : "Aberta a todos os níveis"}
          </dd>
        </div>
        {mission.is_paid && mission.price_cents != null && (
          <div className="flex items-center gap-2">
            <Coins aria-hidden className="size-4 shrink-0 text-dourado" />
            <dt className="sr-only">Valor</dt>
            <dd>{formatPrice(mission.price_cents)} por pessoa, combinado com o mestre</dd>
          </div>
        )}
      </dl>

      {mission.description && <p className="whitespace-pre-line">{mission.description}</p>}

      <section aria-labelledby="mestre" className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <h2 id="mestre" className="text-sm font-medium text-muted-foreground">
            Mestre
          </h2>
          <Link href={`/perfil/${mission.host.id}`} className="font-semibold text-roxo underline-offset-4 hover:underline">
            {mission.host.display_name}
          </Link>
        </div>
        <LevelBadge level={mission.host.player_stats?.level} />
      </section>

      {/* Ação principal */}
      {isOpen && (
        <section aria-label="Participação" className="rounded-xl border-2 border-roxo/20 bg-card p-4">
          {isHost ? (
            <p className="font-medium text-roxo">Você é o mestre desta missão.</p>
          ) : hasStarted && myStatus !== "approved" ? (
            <p className="text-muted-foreground">Esta missão já começou e não aceita novos pedidos.</p>
          ) : (
            <JoinActions
              sessionId={mission.id}
              myStatus={myStatus}
              isFull={isFull}
              belowMinLevel={myLevel < mission.min_level}
            />
          )}
        </section>
      )}

      {contacts && (
        <section aria-labelledby="contato" className="space-y-3 rounded-xl bg-roxo p-4 text-pergaminho">
          <h2 id="contato" className="text-lg font-semibold text-pergaminho">
            Contato do grupo
          </h2>
          {contacts.contact_url && (
            <Button asChild size="lg" className="w-full bg-dourado text-roxo-escuro hover:bg-dourado/90">
              <a href={contacts.contact_url} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
                {isHost
                  ? "Conferir o contato que você informou"
                  : isWhatsApp
                    ? "Abrir WhatsApp do mestre"
                    : "Entrar no Discord do grupo"}
                <ExternalLink aria-hidden className="size-4" />
              </a>
            </Button>
          )}
          {contacts.online_url && (
            <Button
              asChild
              variant="outline"
              className="w-full border-pergaminho/50 bg-transparent text-pergaminho hover:bg-pergaminho/10 hover:text-pergaminho"
            >
              <a href={contacts.online_url} target="_blank" rel="noopener noreferrer">
                <Video aria-hidden /> Link da sala online
              </a>
            </Button>
          )}
        </section>
      )}
      {isHost && isOpen && hasStarted && (
        <CompleteMission
          sessionId={mission.id}
          isTournament={mission.kind === "torneio"}
          players={approved.map((p) => ({ userId: p.user_id, name: p.profile.display_name }))}
        />
      )}

      {!contacts && !isHost && isOpen && (
        <p className="text-sm text-muted-foreground">
          O contato do grupo (WhatsApp ou Discord) aparece aqui depois que o mestre aprovar você.
        </p>
      )}

      {isHost && isOpen && (
        <section aria-labelledby="pedidos" className="space-y-3">
          <h2 id="pedidos" className="text-lg font-semibold">
            Pedidos de entrada {pending.length > 0 && `(${pending.length})`}
          </h2>
          <JoinRequests sessionId={mission.id} requests={pending} underReview={underReview} isFull={isFull} />
        </section>
      )}

      <section aria-labelledby="participantes" className="space-y-3">
        <h2 id="participantes" className="text-lg font-semibold">
          Participantes ({approved.length}/{mission.max_players})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isHost ? "Ninguém aprovado ainda." : "Ninguém confirmado ainda. Seja o primeiro!"}
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {approved.map((p) => (
              <li key={p.user_id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
                <span>
                  <Link href={`/perfil/${p.user_id}`} className="font-medium underline-offset-4 hover:underline">
                    {p.profile.display_name}
                  </Link>
                  {p.user_id === user.id && <span className="text-muted-foreground"> (você)</span>}
                </span>
                <span className="flex items-center gap-1">
                  {p.attended === true && <Badge className="bg-roxo text-pergaminho">Compareceu</Badge>}
                  {p.attended === false && <Badge variant="destructive">Faltou</Badge>}
                  {p.attended == null && <LevelBadge level={p.profile.player_stats?.level} />}
                  {isHost && isOpen && (
                    <RemoveParticipantButton sessionId={mission.id} userId={p.user_id} name={p.profile.display_name} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isHost && isOpen && <CancelMissionButton sessionId={mission.id} />}
    </article>
  );
}
