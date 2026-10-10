import Link from "next/link";
import { CalendarDays, Globe, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSessionDate } from "@/lib/format";
import { GAME_TYPE_LABEL } from "@/lib/missions/labels";
import { getPublicPreview } from "@/lib/public/preview";

// A prévia é a mesma para todos os visitantes: a página é gerada e guardada por
// 5 minutos (carrega rápido e não consulta o banco a cada visita).
export const revalidate = 300;

const highlights = [
  {
    icon: MapPin,
    title: "Locais verificados",
    text: "Mesas presenciais só em cafés, ludotecas e lojas aprovados pela equipe.",
  },
  {
    icon: ShieldCheck,
    title: "Contato protegido",
    text: "O WhatsApp ou Discord do grupo só aparece depois que o mestre aprova você.",
  },
  {
    icon: Trophy,
    title: "Reputação que cresce",
    text: "Cada missão concluída rende XP. Seu nível mostra que dá para confiar em você.",
  },
];

const steps = [
  "Crie sua conta (é grátis, para maiores de 18).",
  "Encontre uma missão ou crie a sua num local verificado.",
  "Peça para entrar: com a aprovação do mestre, o contato do grupo é liberado.",
  "Jogue! Quando o mestre concluir a missão, seu XP sobe.",
];

/** Home pública (RF-09). Quem já está logado é levado direto para /missoes (proxy). */
export default async function Home() {
  const { missions, venues } = await getPublicPreview();

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-roxo px-4 pt-16 pb-12 text-pergaminho">
        <div className="mx-auto max-w-lg space-y-5">
          <p className="text-sm font-semibold tracking-widest text-dourado uppercase">
            Curitiba · RPG · Tabuleiro · TCG
          </p>
          <h1 className="text-4xl leading-tight font-semibold text-pergaminho">Quadro de Missões</h1>
          <p className="text-lg text-pergaminho/90">
            Encontre uma mesa para jogar, ou junte um grupo para a sua. Sem precisar conhecer alguém que conhece alguém.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" className="bg-dourado text-roxo-escuro hover:bg-dourado/90">
              <Link href="/cadastro">Criar conta</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-pergaminho/60 bg-transparent text-pergaminho hover:bg-pergaminho/10 hover:text-pergaminho"
            >
              <Link href="/entrar">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-lg space-y-10 px-4 py-10">
        <section className="space-y-3" aria-label="Por que usar">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-xl bg-card p-4">
              <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-dourado" />
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {missions.length > 0 && (
          <section aria-labelledby="proximas" className="space-y-3">
            <h2 id="proximas" className="text-2xl font-semibold">
              Próximas missões
            </h2>
            <ul className="space-y-2">
              {missions.map((m) => (
                <li key={m.id}>
                  {/* Sem login, o link leva para "Entrar" e depois volta para a missão. */}
                  <Link href={`/missoes/${m.id}`} className="block space-y-1.5 rounded-xl border bg-card p-4 hover:border-roxo/40">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-roxo text-pergaminho">{GAME_TYPE_LABEL[m.game_type]}</Badge>
                      {m.kind === "torneio" && <Badge className="bg-dourado text-roxo-escuro">Torneio</Badge>}
                    </div>
                    <p className="font-heading text-lg font-semibold text-roxo">{m.title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden className="size-4" /> {formatSessionDate(m.starts_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {m.mode === "online" ? <Globe aria-hidden className="size-4" /> : <MapPin aria-hidden className="size-4" />}
                        {m.mode === "online" ? "Online" : m.venue?.name}
                      </span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {venues.length > 0 && (
          <section aria-labelledby="locais" className="space-y-3">
            <h2 id="locais" className="text-2xl font-semibold">
              Locais parceiros
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {venues.map((v) => (
                <li key={v.id} className="rounded-xl border bg-card p-3">
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.game_types.map((g) => GAME_TYPE_LABEL[g]).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="como" className="space-y-3">
          <h2 id="como" className="text-2xl font-semibold">
            Como funciona
          </h2>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-roxo text-sm font-semibold text-dourado">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <Button asChild size="lg" className="w-full">
            <Link href="/cadastro">Criar minha conta</Link>
          </Button>
        </section>
      </div>

      <footer className="mt-auto border-t px-4 py-6 text-center text-xs text-muted-foreground">
        Projeto de Extensão &quot;TI e Sociedade&quot; · Universidade Positivo · Curitiba
      </footer>
    </main>
  );
}
