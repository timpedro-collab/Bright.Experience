/**
 * Retention policy line for post-event reports — states how long captured
 * lead data is kept before the purge cron deletes it (P2.4).
 */
import { DEFAULT_RETENTION_DAYS } from "@/lib/capture-rules";

export function RetentionNotice({
  retentionDays,
}: {
  /** Event-specific window; falls back to the standard default. */
  retentionDays?: number | null;
}) {
  const days = retentionDays ?? DEFAULT_RETENTION_DAYS;
  return (
    <p className="text-xs text-muted-foreground">
      Data retention: captured lead details from this event are held securely
      for {days} days after capture, then deleted automatically. Aggregate
      performance metrics (plays, footfall, demographics) are retained without
      personal data.
    </p>
  );
}
