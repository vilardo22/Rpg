/** Esqueleto da lista enquanto as missões carregam. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando missões">
      <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="h-11 animate-pulse rounded-lg bg-secondary" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-secondary" />
      ))}
    </div>
  );
}
