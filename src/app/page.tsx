import Link from "next/link";
import { MapPin, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: MapPin,
    title: "Locais verificados",
    text: "Mesas presenciais só em cafés, ludotecas e lojas aprovados.",
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

// Home pública. A versão completa da landing (prévia de missões e locais) é P1, Fase 6.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-roxo px-4 pt-16 pb-12 text-pergaminho">
        <div className="mx-auto max-w-lg space-y-5">
          <p className="text-sm font-semibold tracking-widest text-dourado uppercase">
            Curitiba · RPG · Tabuleiro · TCG
          </p>
          <h1 className="text-4xl leading-tight font-semibold text-pergaminho">
            Quadro de Missões
          </h1>
          <p className="text-lg text-pergaminho/90">
            Encontre uma mesa para jogar, ou junte um grupo para a sua.
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

      <section className="mx-auto w-full max-w-lg space-y-4 px-4 py-10">
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
    </main>
  );
}
