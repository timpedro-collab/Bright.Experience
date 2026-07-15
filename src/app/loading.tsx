/**
 * Root loading state — a dashboard-shaped skeleton instead of a blank
 * spinner screen, so the home surface reads as "already there" while the
 * server component streams in. Mirrors the shared shell: top bar,
 * greeting, focus list, and an event-card strip.
 */

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/40">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="h-5 w-28 rounded bg-muted/50 animate-pulse" />
          <div className="hidden lg:block h-8 w-72 rounded-lg bg-muted/30 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-muted/40 animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Greeting + headline */}
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
          <div className="h-8 w-80 max-w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-64 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>

        {/* Primary next-step / focus card */}
        <div className="rounded-2xl border border-border/40 p-6 space-y-4">
          <div className="h-3 w-32 rounded bg-muted/50 animate-pulse" />
          <div className="h-5 w-3/4 rounded bg-muted/40 animate-pulse" />
          <div className="h-9 w-40 rounded-lg bg-muted/50 animate-pulse" />
        </div>

        {/* Focus list rows */}
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-muted/50 animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border/30 px-4 py-3.5"
            >
              <div className="h-4 w-4 rounded bg-muted/40 animate-pulse shrink-0" />
              <div className="h-4 flex-1 rounded bg-muted/30 animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted/40 animate-pulse shrink-0" />
            </div>
          ))}
        </div>

        {/* Event card strip */}
        <div className="space-y-3">
          <div className="h-3 w-32 rounded bg-muted/50 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/40 p-5 space-y-3"
              >
                <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-muted/40 animate-pulse" />
                <div className="h-2 w-full rounded-full bg-muted/30 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
