/**
 * Walkthrough scheduler — Cal.com inline embed with a preset-picker fallback.
 *
 * INTEGRATION: Cal.com
 *
 * When `NEXT_PUBLIC_CALCOM_LINK` is set, this renders the real Cal.com booker
 * inline (availability, timezones, reminders, and Google Calendar sync are all
 * handled by Cal.com). The quote id travels as booking metadata so the
 * /api/webhooks/calcom route can write the booked slot back onto the quote.
 *
 * When the env var is unset (demos, offline work), it falls back to the
 * self-contained preset slot picker (`WalkthroughBooker`), so the flow always
 * works.
 */
"use client";

import Cal from "@calcom/embed-react";

import { getCalcomLink } from "@/lib/calcom";
import { WalkthroughBooker } from "@/components/quotes/WalkthroughBooker";

interface WalkthroughSchedulerProps {
  quoteId: string;
  aeFirstName: string;
  /** Prefill for the Cal.com booking form. */
  contactName?: string;
  contactEmail?: string;
  initialSlotLabel?: string | null;
}

export function WalkthroughScheduler({
  quoteId,
  aeFirstName,
  contactName,
  contactEmail,
  initialSlotLabel,
}: WalkthroughSchedulerProps) {
  const calLink = getCalcomLink();

  if (!calLink) {
    return (
      <WalkthroughBooker
        quoteId={quoteId}
        aeFirstName={aeFirstName}
        initialSlotLabel={initialSlotLabel}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-primary/15 bg-background">
      <Cal
        calLink={calLink}
        style={{ width: "100%", minHeight: "560px" }}
        config={{
          theme: "light",
          layout: "month_view",
          ...(contactName ? { name: contactName } : {}),
          ...(contactEmail ? { email: contactEmail } : {}),
          // Round-trips through the BOOKING_CREATED webhook as
          // payload.metadata.quoteId so the booking lands on the right quote.
          "metadata[quoteId]": quoteId,
        }}
      />
    </div>
  );
}
