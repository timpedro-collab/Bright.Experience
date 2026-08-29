/** Compact presentational card for the embeddable venue advertising widget. */
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateGB, formatDateRangeGB } from "@/lib/dates";

export interface VenueWidgetCardProps {
  venueName: string;
  openSlotCount: number;
  fromPricePence: number | null;
  nextWindow: { start: string; end: string | null } | null;
  advertiseHref: string;
}

const CTA_CLASS =
  "inline-flex items-center gap-1.5 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90";

/** Compact venue advertising card for iframe embeds. */
export function VenueWidgetCard({
  venueName,
  openSlotCount,
  fromPricePence,
  nextWindow,
  advertiseHref,
}: VenueWidgetCardProps) {
  const fullyBooked = openSlotCount === 0;

  return (
    <div className="max-w-sm rounded border border-border bg-background p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Advertise here
      </p>
      <h2 className="mt-2 text-lg font-bold text-foreground">{venueName}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interactive screens against real footfall.
      </p>

      <div className="mt-4 text-sm text-foreground">
        {fullyBooked ? (
          <p>
            Fully booked right now — join the waitlist for the next window.
          </p>
        ) : (
          <>
            <p>
              {openSlotCount} slot{openSlotCount === 1 ? "" : "s"} open
              {fromPricePence != null && (
                <>
                  {" "}
                  · from {formatMoneyFromPence(fromPricePence)}/wk
                </>
              )}
            </p>
            {nextWindow && (
              <p className="mt-1 text-muted-foreground">
                Next window:{" "}
                {nextWindow.end
                  ? formatDateRangeGB(nextWindow.start, nextWindow.end)
                  : formatDateGB(nextWindow.start)}
              </p>
            )}
          </>
        )}
      </div>

      <a
        href={advertiseHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CTA_CLASS} mt-5`}
      >
        See open slots
      </a>

      {/* An invitation, not a credit — the reader may be the next buyer. */}
      <a
        href="/book?utm_source=venue_widget&utm_medium=referral&utm_campaign=invitation"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Want results like this at your event? →
      </a>
    </div>
  );
}
