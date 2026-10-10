import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

/** Cabeçalho das telas logadas. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-roxo text-pergaminho">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link
          href="/missoes"
          className="font-heading text-lg font-semibold focus-visible:outline-dourado"
        >
          Quadro de Missões
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-pergaminho/85 hover:text-pergaminho focus-visible:outline-dourado"
          >
            <LogOut aria-hidden className="size-5" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
