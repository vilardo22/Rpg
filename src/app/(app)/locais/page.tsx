import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Locais" };

// Provisório (Fase 0): mapa e lista de locais chegam na Fase 3.
export default function LocaisPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Locais</h1>
      <EmptyState
        icon={<MapPin aria-hidden className="size-10 text-dourado" />}
        title="Em construção"
        description="Aqui vai ficar o mapa dos locais verificados em Curitiba."
      />
    </section>
  );
}
