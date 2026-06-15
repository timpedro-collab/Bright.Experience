/** Loading skeleton for the event detail page — branded shimmer with a placeholder hero. */

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Placeholder ridge hero area */}
      <div className="relative isolate overflow-hidden">
        <div className="h-[clamp(220px,28vw,360px)] bg-muted/40" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 -mt-24 pb-8">
          <div className="h-3 w-28 rounded bg-muted/50 animate-pulse mb-4" />
          <div className="h-8 w-72 rounded bg-muted/60 animate-pulse mb-3" />
          <div className="h-4 w-96 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>
      </div>

      {/* Content shimmer blocks */}
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Stage progress placeholder */}
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-muted/30 animate-pulse" />
        </div>

        <div className="h-px bg-border/40" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-x-12 gap-y-10">
          {/* Main column */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-3 w-32 rounded bg-muted/50 animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="h-4 w-4 rounded bg-muted/40 animate-pulse shrink-0" />
                  <div className="h-4 flex-1 rounded bg-muted/30 animate-pulse" />
                </div>
              ))}
            </div>

            <div className="h-px bg-border/40" />

            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded bg-muted/40 animate-pulse shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
                      <div className="h-3.5 w-full rounded bg-muted/30 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted/40 animate-pulse shrink-0" />
                  <div className="h-3 flex-1 rounded bg-muted/30 animate-pulse" />
                </div>
              ))}
            </div>

            <div className="h-px bg-border/40" />

            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-border/40"
                >
                  <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
                  <div className="h-4 w-8 rounded bg-muted/40 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-[var(--color-bb-cobalt)] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading event…
          </p>
        </div>
      </div>
    </div>
  );
}
