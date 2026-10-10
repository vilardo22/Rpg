/** Esqueleto do detalhe enquanto a missão carrega. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando missão">
      <div className="h-6 w-24 animate-pulse rounded-md bg-secondary" />
      <div className="h-10 w-3/4 animate-pulse rounded-md bg-secondary" />
      <div className="h-48 animate-pulse rounded-xl bg-secondary" />
      <div className="h-20 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}
