"use client";

import { Button } from "@/components/ui/button";

/** Erro inesperado numa tela logada: explica e oferece tentar de novo. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-xl border bg-card p-6 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground">
        Não conseguimos carregar esta tela. Confira sua conexão e tente de novo.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
