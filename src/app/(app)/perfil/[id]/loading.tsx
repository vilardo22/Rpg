/** Esqueleto do perfil enquanto carrega. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando perfil">
      <div className="flex items-center gap-4">
        <div className="size-16 animate-pulse rounded-full bg-secondary" />
        <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      </div>
      <div className="h-20 animate-pulse rounded-xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-xl bg-secondary" />
      <div className="h-40 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}
