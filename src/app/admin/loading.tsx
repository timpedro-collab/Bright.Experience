/** Admin section loading skeleton — branded shimmer for table-based views. */

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Header shimmer */}
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
          <div className="h-8 w-64 rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>

        <div className="h-px bg-border/40" />

        {/* Table header shimmer */}
        <div className="flex items-center gap-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-muted/40 animate-pulse"
              style={{ width: `${60 + i * 20}px` }}
            />
          ))}
        </div>

        {/* Table rows shimmer */}
        <div className="divide-y divide-border/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <div className="h-4 w-32 rounded bg-muted/30 animate-pulse" />
              <div className="h-4 w-48 rounded bg-muted/25 animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-muted/40 animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted/25 animate-pulse ml-auto" />
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-6">
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
