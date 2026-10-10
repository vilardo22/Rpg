/** Esqueleto enquanto os locais carregam. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando locais">
      <div className="h-8 w-32 animate-pulse rounded-md bg-secondary" />
      <div className="h-[320px] animate-pulse rounded-xl bg-secondary" />
      <div className="h-28 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}
