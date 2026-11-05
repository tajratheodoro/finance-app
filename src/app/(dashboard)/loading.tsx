// Static placeholder in palette tones: no pulse or shimmer loop.
export default function Loading() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="h-8 w-48 max-w-full rounded-full bg-muted" />
      <div aria-hidden className="h-40 rounded-3xl bg-muted" />
      <div aria-hidden className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-3xl bg-muted" />
        <div className="h-28 rounded-3xl bg-muted/60" />
      </div>
    </div>
  )
}
