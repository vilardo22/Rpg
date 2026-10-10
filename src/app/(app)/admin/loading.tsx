/** Esqueleto do painel admin enquanto carrega. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando painel">
      <div className="h-8 w-48 animate-pulse rounded-md bg-secondary" />
      <div className="h-12 animate-pulse rounded-lg bg-secondary" />
      <div className="h-40 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}
