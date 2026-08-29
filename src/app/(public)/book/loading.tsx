/** Booking flow loading skeleton — branded shimmer for the public booking pages. */

export default function BookLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress bar placeholder */}
        <div className="space-y-2">
          <div className="h-2.5 w-16 rounded bg-muted/50 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-muted/30 animate-pulse" />
        </div>

        {/* Form card shimmer */}
        <div className="rounded-[var(--radius-card)] border border-border/40 bg-card/50 p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-72 max-w-full rounded bg-muted/35 animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted/25 animate-pulse" />
            </div>
          ))}
          <div className="h-10 w-32 rounded-[var(--radius-control)] bg-muted/50 animate-pulse mt-4" />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
