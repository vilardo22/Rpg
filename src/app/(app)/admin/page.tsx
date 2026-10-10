import type { Metadata } from "next";
import Link from "next/link";
import { Flag, MapPin, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { listPendingVenues, listReports, listUsers, type AdminReport } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { formatSessionDate } from "@/lib/format";
import { GAME_TYPE_LABEL, levelName } from "@/lib/missions/labels";
import { directionsUrl } from "@/lib/venues/links";
import { cn } from "@/lib/utils";
import { ReportDecision, VenueDecision } from "./admin-buttons";

export const metadata: Metadata = { title: "Painel admin" };

const TABS = [
  { key: "locais", label: "Locais", icon: MapPin },
  { key: "denuncias", label: "Denúncias", icon: Flag },
  { key: "usuarios", label: "Usuários", icon: Users },
] as const;
type Tab = (typeof TABS)[number]["key"];

const STATUS_LABEL: Record<AdminReport["status"], string> = {
  open: "Aberta",
  confirmed: "Confirmada",
  dismissed: "Descartada",
};

/** Alvo da denúncia: o perfil, ou a missão (e o mestre, que é quem perde XP). */
function ReportTarget({ report }: { report: AdminReport }) {
  if (report.target_user) {
    return (
      <>
        Perfil:{" "}
        <Link href={`/perfil/${report.target_user.id}`} className="font-semibold text-roxo underline">
          {report.target_user.display_name}
        </Link>
      </>
    );
  }
  if (report.target_session) {
    return (
      <>
        Missão:{" "}
        <Link href={`/missoes/${report.target_session.id}`} className="font-semibold text-roxo underline">
          {report.target_session.title}
        </Link>{" "}
        (mestre {report.target_session.host.display_name})
      </>
    );
  }
  return <>Alvo removido</>;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  // Quem não é admin recebe 404 aqui, antes de qualquer consulta.
  await requireAdmin();
  const { aba } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === aba) ? (aba as Tab) : "locais";

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Painel admin</h1>

      <nav aria-label="Seções do painel" className="grid grid-cols-3 rounded-lg bg-secondary p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin?aba=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium",
              tab === key ? "bg-card text-roxo shadow-sm" : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </Link>
        ))}
      </nav>

      {tab === "locais" && <VenuesTab />}
      {tab === "denuncias" && <ReportsTab />}
      {tab === "usuarios" && <UsersTab />}
    </section>
  );
}

async function VenuesTab() {
  const venues = await listPendingVenues();
  if (venues.length === 0) {
    return <EmptyState title="Nenhum local aguardando aprovação" description="Sugestões novas aparecem aqui." />;
  }
  return (
    <ul className="space-y-3">
      {venues.map((v) => (
        <li key={v.id} className="space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{v.name}</h2>
            <p className="text-sm text-muted-foreground">{v.address}</p>
            <p className="text-sm">
              Sugerido por {v.suggester?.display_name ?? "—"} em {formatSessionDate(v.created_at)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {v.game_types.map((g) => (
                <Badge key={g} variant="outline">
                  {GAME_TYPE_LABEL[g]}
                </Badge>
              ))}
            </div>
            {v.description && <p className="text-sm">{v.description}</p>}
            <a
              href={directionsUrl(v.lat, v.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-medium text-roxo underline"
            >
              Conferir no mapa
            </a>
          </div>
          <VenueDecision venueId={v.id} />
        </li>
      ))}
    </ul>
  );
}

async function ReportsTab() {
  const { open, reviewed } = await listReports();
  return (
    <div className="space-y-5">
      {open.length === 0 ? (
        <EmptyState title="Nenhuma denúncia aberta" description="Quando alguém denunciar um perfil ou missão, aparece aqui." />
      ) : (
        <ul className="space-y-3">
          {open.map((r) => (
            <li key={r.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="space-y-1 text-sm">
                <p className="text-base font-semibold">{r.reason}</p>
                <p>
                  <ReportTarget report={r} />
                </p>
                {r.details && <p className="rounded-lg bg-secondary p-2 whitespace-pre-line">{r.details}</p>}
                <p className="text-muted-foreground">
                  Enviada por {r.reporter.display_name} em {formatSessionDate(r.created_at)}
                </p>
              </div>
              <ReportDecision reportId={r.id} />
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <section aria-labelledby="revisadas" className="space-y-2">
          <h2 id="revisadas" className="text-lg font-semibold">
            Revisadas recentemente
          </h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {reviewed.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  {r.reason} · <ReportTarget report={r} />
                </span>
                <Badge variant={r.status === "confirmed" ? "destructive" : "outline"}>{STATUS_LABEL[r.status]}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

async function UsersTab() {
  const users = await listUsers();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {users.length} usuários. Somente leitura: dados privados (CPF, nascimento, telefone) não aparecem aqui.
      </p>
      <ul className="divide-y rounded-xl border bg-card">
        {users.map((u) => (
          <li key={u.id} className="space-y-1 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/perfil/${u.id}`} className="font-semibold text-roxo underline-offset-4 hover:underline">
                {u.display_name}
              </Link>
              {u.role === "admin" && <Badge className="bg-roxo text-pergaminho">Admin</Badge>}
              {u.openReports > 0 && (
                <Badge variant="destructive">
                  {u.openReports} {u.openReports === 1 ? "denúncia aberta" : "denúncias abertas"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Nv. {u.stats?.level ?? 1} {levelName(u.stats?.level)} · {u.stats?.xp ?? 0} XP · {u.stats?.sessions_played ?? 0}{" "}
              jogadas · {u.stats?.no_shows ?? 0} faltas · desde {formatSessionDate(u.created_at).split(" · ")[0]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
