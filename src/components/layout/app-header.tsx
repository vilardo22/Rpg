import Link from "next/link";

/** Cabeçalho das telas logadas. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-roxo text-pergaminho">
      <div className="mx-auto flex h-14 max-w-lg items-center px-4">
        <Link
          href="/missoes"
          className="font-heading text-lg font-semibold focus-visible:outline-dourado"
        >
          Quadro de Missões
        </Link>
      </div>
    </header>
  );
}
