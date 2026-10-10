import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

/** Cabeçalho das telas logadas. */
export async function AppHeader() {
  const admin = await isAdmin();
  return (
    <header className="sticky top-0 z-40 bg-roxo text-pergaminho">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link
          href="/missoes"
          className="font-heading text-lg font-semibold focus-visible:outline-dourado"
        >
          Quadro de Missões
        </Link>
        <div className="flex items-center gap-1">
          {admin && (
            <Link
              href="/admin"
              className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-dourado hover:text-pergaminho focus-visible:outline-dourado"
            >
              <ShieldCheck aria-hidden className="size-5" />
              Admin
            </Link>
          )}
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
      </div>
    </header>
  );
}
