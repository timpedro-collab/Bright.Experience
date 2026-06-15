/** Partner portal loading skeleton — branded shimmer. */

export default function PartnerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative isolate overflow-hidden">
        <div className="h-[clamp(180px,22vw,280px)] bg-muted/40" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 -mt-16 pb-6">
          <div className="h-3 w-20 rounded bg-muted/50 animate-pulse mb-3" />
          <div className="h-7 w-56 rounded bg-muted/60 animate-pulse mb-2" />
          <div className="h-4 w-80 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Stats row shimmer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-border/40 bg-card/50 p-5 space-y-2"
            >
              <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
              <div className="h-6 w-12 rounded bg-muted/50 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-px bg-border/40" />

        {/* Content shimmer */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-4 w-48 rounded bg-muted/30 animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted/25 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-[var(--color-bb-cobalt)] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </div>
    </div>
  );
}
