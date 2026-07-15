/**
 * The customer's home when they have no event in flight yet.
 *
 * Two real in-app states (never a dead end, never the public funnel):
 *   - "Awaiting confirmation" — they have an in-flight quote/proposal. We
 *     show its summary and the next step (review proposal / talk to your AM).
 *   - "Discovery" — no quote yet. We invite them to the catalog/quiz, framed
 *     as a warm in-portal moment rather than a marketing page.
 */
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  CalendarClock,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";

import { GlassCard } from "@/components/cloud";
import { EditorialEyebrow } from "@/components/brand";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";

interface PendingQuote {
  id: string;
  status?: string | null;
  event_type?: string | null;
  venue_name?: string | null;
  event_date_start?: string | null;
  total_amount?: number | null;
}

// Keys must match the quote.status values actually written by the booking
// flow (see src/app/actions/quotes.ts): draft → submitted → proposal_sent →
// accepted. Terminal states (declined/expired/etc.) are filtered out upstream
// by getPendingQuotesForCustomer, so they never reach this component.
const STATUS_COPY: Record<string, { label: string; blurb: string }> = {
  draft: {
    label: "Being prepared",
    blurb: "Our team is putting your proposal together. We'll be in touch shortly.",
  },
  submitted: {
    label: "With our team",
    blurb: "We've received your request and are pricing it up now.",
  },
  proposal_sent: {
    label: "Ready to review",
    blurb: "Your proposal is ready — take a look and let us know.",
  },
  accepted: {
    label: "Confirmed",
    blurb: "You're confirmed. We're setting up your event workspace now.",
  },
};

function statusCopy(status?: string | null) {
  return (
    STATUS_COPY[String(status ?? "")] ?? {
      label: "In progress",
      blurb: "Your proposal is moving through our team.",
    }
  );
}

export function CustomerHoldingState({
  firstName,
  pendingQuotes,
}: {
  firstName: string;
  pendingQuotes: PendingQuote[];
}) {
  const quote = pendingQuotes[0];

  if (quote) {
    const copy = statusCopy(quote.status);
    return (
      <section className="py-12 md:py-16">
        <EditorialEyebrow accent>Welcome back, {firstName}</EditorialEyebrow>
        <h1 className="text-display text-foreground text-[clamp(2rem,4.5vw,3.5rem)] mt-3">
          Your proposal is {copy.label.toLowerCase()}.
        </h1>
        <p className="mt-4 max-w-[54ch] text-base text-muted-foreground">
          {copy.blurb} Your event workspace unlocks automatically the moment
          it&apos;s confirmed.
        </p>

        <GlassCard className="mt-8 max-w-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {quote.event_type ?? "Your activation"}
                </p>
                <p className="text-overline text-muted-foreground">
                  Proposal · {copy.label}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-overline text-muted-foreground">
              <Clock className="h-3 w-3" /> {copy.label}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {quote.venue_name && (
              <Detail icon={MapPin} label="Venue" value={quote.venue_name} />
            )}
            {quote.event_date_start && (
              <Detail
                icon={CalendarClock}
                label="Target date"
                value={formatDateShort(quote.event_date_start)}
              />
            )}
            {typeof quote.total_amount === "number" && quote.total_amount > 0 && (
              <Detail
                icon={FileText}
                label="Estimate"
                value={formatMoneyFromPence(quote.total_amount)}
              />
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/proposal/${quote.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              Review proposal <ArrowRight className="size-4" />
            </Link>
            <a
              href={`mailto:${DEFAULT_ACCOUNT_MANAGER.email}`}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <MessageCircle className="size-4" /> Message {DEFAULT_ACCOUNT_MANAGER.firstName}
            </a>
          </div>
        </GlassCard>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20">
      <EditorialEyebrow>Welcome, {firstName}</EditorialEyebrow>
      <h1 className="text-display text-foreground text-[clamp(2.25rem,5vw,4rem)] mt-3">
        Let&apos;s find your fit.
      </h1>
      <p className="mt-4 max-w-[52ch] text-base text-muted-foreground">
        No activations in flight yet. Take the 60-second quiz and we&apos;ll
        build a proposal with you, or browse the catalog to see what&apos;s
        possible.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          Find a fit <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Browse the catalog
        </Link>
        <a
          href={`mailto:${DEFAULT_ACCOUNT_MANAGER.email}`}
          className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" /> Talk to us first
        </a>
      </div>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-overline text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
