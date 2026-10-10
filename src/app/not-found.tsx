import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Página 404 do app inteiro, em português (o padrão do Next é em inglês). */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-heading text-5xl font-semibold text-roxo">404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O link pode estar errado, ou esta página não existe mais.</p>
      <Button asChild>
        <Link href="/missoes">Ver missões</Link>
      </Button>
    </main>
  );
}
