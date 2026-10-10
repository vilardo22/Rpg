import type { Metadata } from "next";
import { User } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Perfil" };

// Provisório (Fase 0): na Fase 1 esta rota passa a redirecionar para /perfil/[id] do usuário logado.
export default function PerfilPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <EmptyState
        icon={<User aria-hidden className="size-10 text-dourado" />}
        title="Em construção"
        description="Seu nível, XP e histórico de missões vão aparecer aqui."
      />
    </section>
  );
}
