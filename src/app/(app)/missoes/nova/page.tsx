import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Criar missão" };

// Provisório (Fase 0): o formulário chega na Fase 2.
export default function NovaMissaoPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Criar missão</h1>
      <EmptyState
        title="Em construção"
        description="Logo você vai poder criar mesas e torneios por aqui."
      />
    </section>
  );
}
