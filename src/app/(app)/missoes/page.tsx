import type { Metadata } from "next";
import { Scroll } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Missões" };

// Provisório (Fase 0): a lista com filtros chega na Fase 2.
export default function MissoesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Missões</h1>
      <EmptyState
        icon={<Scroll aria-hidden className="size-10 text-dourado" />}
        title="Nenhuma missão por aqui"
        description="Crie a primeira e chame o pessoal para jogar."
        action={{ href: "/missoes/nova", label: "Criar missão" }}
      />
    </section>
  );
}
