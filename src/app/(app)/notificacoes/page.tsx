import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Avisos" };

// Provisório (Fase 0): a central de notificações chega na Fase 5.
export default function NotificacoesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Avisos</h1>
      <EmptyState
        icon={<Bell aria-hidden className="size-10 text-dourado" />}
        title="Nenhum aviso por enquanto"
        description="Pedidos de entrada e aprovações vão aparecer aqui."
      />
    </section>
  );
}
