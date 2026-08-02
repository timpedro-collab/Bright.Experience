/**
 * Loading skeleton shared by the three public capability-URL surfaces.
 *
 * All three are read-only documents with the same shape: a title block, a row
 * of headline figures, then stacked content cards. Holding that shape while the
 * data resolves keeps the page from jumping under the reader.
 */

export function CapabilityLinkSkeleton({
  /** Headline figures above the body — 4 for a report, 3 for a pitch. */
  metrics = 4,
  /** Content cards below the figures. */
  cards = 3,
}: {
  metrics?: number;
  cards?: number;
}) {
  return (
    <div
      className="mx-auto max-w-4xl px-6 py-14"
      role="status"
      aria-label="Loading"
    >
      <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted/50" />
      <div className="mb-2 h-9 w-2/3 animate-pulse rounded bg-muted/60" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40" />

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: metrics }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-[var(--radius-card)] border border-border/40 bg-card/50 p-5"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
            <div className="h-7 w-14 animate-pulse rounded bg-muted/50" />
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-[var(--radius-card)] border border-border/40 bg-card/40 p-6"
          >
            <div className="h-4 w-40 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-full animate-pulse rounded bg-muted/25" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
