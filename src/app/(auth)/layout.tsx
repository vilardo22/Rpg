import Link from "next/link";
import type { ReactNode } from "react";

/** Moldura das telas de cadastro e login: marca no topo e cartão centralizado. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="bg-roxo text-pergaminho">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <Link href="/" className="font-heading text-lg font-semibold focus-visible:outline-dourado">
            Quadro de Missões
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">{children}</main>
    </>
  );
}
