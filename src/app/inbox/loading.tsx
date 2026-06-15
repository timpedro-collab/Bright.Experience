/** Inbox loading skeleton — branded shimmer for the task queue. */

export default function InboxLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero placeholder */}
      <div className="relative isolate overflow-hidden">
        <div className="h-[clamp(180px,22vw,280px)] bg-muted/40" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 -mt-16 pb-6">
          <div className="h-3 w-24 rounded bg-muted/50 animate-pulse mb-3" />
          <div className="h-7 w-48 rounded bg-muted/60 animate-pulse mb-2" />
          <div className="h-4 w-72 max-w-full rounded bg-muted/40 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Filter bar shimmer */}
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-md bg-muted/30 animate-pulse" />
          ))}
        </div>

        {/* Task group shimmer */}
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="divide-y divide-border/40 border-t border-b border-border/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 pl-3">
                  <div className="h-7 w-[88px] rounded-md bg-muted/40 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-muted/30 animate-pulse" />
                    <div className="h-2.5 w-1/2 rounded bg-muted/25 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
