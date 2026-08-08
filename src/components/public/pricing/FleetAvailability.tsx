/**
 * FleetAvailability — the honest scarcity module on the pricing page.
 *
 * Shows how many units of the real fleet are already committed for each of
 * the next few months, derived from the live booking calendar (events +
 * venue placements). No countdown timers, no invented urgency: when a month
 * reads "fully booked" it is because the calendar says so.
 */
import type { MonthAvailability } from "@/lib/pricing/fleet-availability";
import { cn } from "@/lib/utils";

export function FleetAvailability({ months }: { months: MonthAvailability[] }) {
  const shown = months.filter((m) => m.total > 0);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Fleet availability — live from the booking calendar
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {shown.map((m) => {
          const free = m.total - m.booked;
          const full = free <= 0;
          const ratio = m.total > 0 ? m.booked / m.total : 0;
          return (
            <div
              key={m.month}
              className="rounded-[var(--radius-card)] border border-border/60 bg-background/60 p-4"
            >
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.booked} of {m.total} units booked
              </p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/60"
                role="img"
                aria-label={`${m.booked} of ${m.total} units booked for ${m.label}`}
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    full ? "bg-destructive/70" : "bg-[var(--color-bb-cobalt)]",
                  )}
                  style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {full
                  ? "Fully booked — join the waitlist via a proposal"
                  : `${free} unit${free === 1 ? "" : "s"} still free`}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        We run a finite fleet and never overbook it. These figures come from
        the same calendar our ops team schedules against — when a month is
        full, it&apos;s genuinely full.
      </p>
    </div>
  );
}
