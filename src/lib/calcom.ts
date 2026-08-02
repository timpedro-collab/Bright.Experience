/**
 * Cal.com scheduling helpers.
 *
 * INTEGRATION: Cal.com
 *
 * Bright.Experience uses Cal.com for the 15-minute proposal walkthrough call.
 * Each AE connects their own Google Calendar inside Cal.com, so availability
 * and booked calls sync natively — we never talk to the Google API ourselves.
 *
 * Wiring:
 *   - `NEXT_PUBLIC_CALCOM_LINK` — the event-type path (e.g. "brightblue/15min").
 *     When set, customer surfaces render the inline Cal.com embed; when unset,
 *     the self-contained preset slot picker (`WalkthroughBooker`) is used.
 *   - `CALCOM_WEBHOOK_SECRET` — shared secret for the inbound booking webhook
 *     at /api/webhooks/calcom (see that route for the payload contract).
 */

/** Fallback event-type path used until a real Cal.com account is configured. */
export const DEFAULT_CALCOM_LINK = "brightblue/15min";

/** The configured Cal.com event-type path, or null when not set up. */
export function getCalcomLink(): string | null {
  const link = process.env.NEXT_PUBLIC_CALCOM_LINK?.trim();
  return link ? link.replace(/^\/+|\/+$/g, "") : null;
}

/** Full booking-page URL for a Cal.com event-type path. */
export function calcomBookingUrl(link: string): string {
  return `https://cal.com/${link.replace(/^\/+/, "")}`;
}

/**
 * Resolve the walkthrough URL for a quote: the per-quote override wins,
 * then the configured Cal.com link, then the fallback path.
 */
export function walkthroughUrlFor(quoteUrl?: string | null): string {
  if (quoteUrl?.trim()) return quoteUrl.trim();
  return calcomBookingUrl(getCalcomLink() ?? DEFAULT_CALCOM_LINK);
}

/**
 * Format a booking start time as the portal's slot label, e.g.
 * "Thu 2 Jul · 2:00 PM". Rendered in Europe/London so webhook-sourced UTC
 * timestamps match what the customer picked.
 */
export function formatSlotLabel(startTimeIso: string): string | null {
  const date = new Date(startTimeIso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
  return `${day} · ${time}`;
}
