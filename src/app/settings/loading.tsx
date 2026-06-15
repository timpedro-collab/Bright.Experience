/** Settings loading skeleton — branded shimmer for the settings hub. */

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero placeholder */}
      <div className="relative isolate overflow-hidden">
        <div className="h-[clamp(180px,22vw,280px)] bg-muted/40" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 -mt-16 pb-6">
          <div className="h-3 w-16 rounded bg-muted/50 animate-pulse mb-3" />
          <div className="h-7 w-44 rounded bg-muted/60 animate-pulse mb-2" />
          <div className="h-4 w-80 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />

        {/* Settings cards shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-border/40 bg-card/50 p-6 space-y-3"
            >
              <div className="h-6 w-6 rounded bg-muted/40 animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-full rounded bg-muted/30 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-muted/25 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-px bg-border/40" />

        {/* Profile details shimmer */}
        <div className="space-y-3 max-w-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-border/30">
              <div className="h-4 w-16 rounded bg-muted/35 animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted/30 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
