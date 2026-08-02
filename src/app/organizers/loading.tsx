/**
 * Organizer portal loading skeleton.
 *
 * Mirrors the portal shell — hero band, then a stack of list rows — so the
 * layout doesn't jump when the shows, fleet or sponsor data resolves.
 */

export default function OrganizerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative isolate overflow-hidden">
        <div className="h-[clamp(160px,20vw,240px)] bg-muted/40" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 -mt-14 pb-6">
          <div className="mb-3 h-3 w-20 animate-pulse rounded bg-muted/50" />
          <div className="mb-2 h-7 w-64 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/40" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-[var(--radius-card)] border border-border/40 bg-card/50 p-5"
            >
              <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
              <div className="h-6 w-12 animate-pulse rounded bg-muted/50" />
            </div>
          ))}
        </div>

        <div className="h-px bg-border/40" />

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border/40 bg-card/40 p-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted/40" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-52 animate-pulse rounded bg-muted/40" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted/25" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-muted/25" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
