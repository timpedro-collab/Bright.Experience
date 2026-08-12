/** Proposal delivery page — editorial, narrative proposal with a call-first flow. */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Container, Section } from "@/components/ui/section";
import { getQuoteForProposal } from "@/lib/queries/quotes";
import { getBenchmarksForEventType } from "@/lib/queries/benchmarks";
import { buildProposalDocument } from "@/lib/proposals/build-proposal";
import {
  buildExpectation,
  formatRange,
  showDayCount,
} from "@/lib/metrics/expected-performance";
import { daysUntilExpiry, validityLabel } from "@/lib/proposals/validity";
import { formatPriceBand } from "@/lib/proposals/price-band";
import { formatGBP } from "@/lib/roi";
import { formatNumberUS } from "@/lib/currency";
import { ProposalDocumentView } from "@/components/quotes/proposal/ProposalDocumentView";
import { ProposalJourney } from "@/components/quotes/proposal/ProposalJourney";
import { PrintProposalButton } from "@/components/quotes/proposal/PrintProposalButton";
import { ShareProposalButton } from "@/components/quotes/proposal/ShareProposalButton";
import { ChampionSummaryCard } from "@/components/quotes/proposal/ChampionSummaryCard";
import { buildProposalJourney } from "@/lib/proposals/proposal-extras";
import { AcceptedAddOns } from "@/components/quotes/proposal/AcceptedAddOns";
import { PostAcceptBanner } from "@/components/quotes/PostAcceptBanner";
import {
  isVolumeLadderCustomerVisible,
  shouldAutoProvisionQuote,
} from "@/lib/booking-flags";
import { walkthroughUrlFor } from "@/lib/calcom";
import { recordLoopEvent } from "@/server/loop-events";

export const metadata: Metadata = {
  title: "Your proposal",
  description: "Your bespoke Bright.Blue proposal.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const quote = await getQuoteForProposal(id);
  if (!quote) notFound();

  // Loop pulse: every proposal page open counts towards proposal views
  // on /admin/loop-pulse. Fire-and-forget — never blocks the page.
  await recordLoopEvent("proposal_view", {
    artifact: "proposal",
    ...(quote.event_id ? { eventId: quote.event_id } : {}),
    metadata: { quoteId: quote.id, status: quote.status },
  });

  const doc = buildProposalDocument(quote);

  // Pricing + accept/decline are revealed only after the walkthrough call
  // (or once the proposal has already been accepted).
  const priceRevealed =
    Boolean(quote.walkthrough_completed_at) || quote.status === "accepted";
  const isExpired = quote.expires_at
    ? new Date(quote.expires_at) < new Date()
    : false;
  const canRespond = quote.status === "proposal_sent" && !isExpired;
  const walkthroughUrl = walkthroughUrlFor(quote.walkthrough_url);

  // Honest urgency: the countdown reflects the enforced expires_at, and only
  // shows while the proposal is actually open for a decision.
  const validity =
    quote.status === "proposal_sent"
      ? validityLabel(daysUntilExpiry(quote.expires_at))
      : null;

  // Benchmark-backed performance ranges from what comparable activations have
  // actually done — distinct from the reach band, which models advertising.
  const eventType = String(quote.event_type ?? "activation");
  const benchmarks = await getBenchmarksForEventType(eventType);
  const days = quote.event_date_start
    ? showDayCount(quote.event_date_start, quote.event_date_end)
    : (quote.activation_days ?? 1);
  const shared = {
    eventType,
    machineType: quote.machine_preference ? String(quote.machine_preference) : null,
    days,
  };
  const expectedPlays = buildExpectation(benchmarks, { metric: "plays", ...shared });
  const expectedLeads = buildExpectation(benchmarks, { metric: "leads", ...shared });

  // Absolute link for the forward/summary tools — this page is the artefact
  // a champion sends up the chain.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const proposalUrl = `${proto}://${host}/proposal/${quote.id}`;

  // The whole proposal in a few plain lines, ready to paste into an email or
  // Slack for whoever signs it off. Price only appears once it's revealed.
  const summaryLines = [
    `What: ${doc.cover.title}`,
    `When: ${doc.investment.dateLabel} · ${doc.investment.durationLabel} on site`,
    doc.reach
      ? `Projected reach: ${formatNumberUS(doc.reach.impressions)} impressions · ${formatNumberUS(doc.reach.leads)} leads`
      : expectedPlays
        ? `Projected plays: ${formatRange(expectedPlays.totalLow, expectedPlays.totalHigh)}`
        : null,
    priceRevealed
      ? `Investment: ${formatGBP(doc.investment.feePence / 100)} all-in`
      : doc.investment.indicativeBand
        ? `Indicative range: ${formatPriceBand(doc.investment.indicativeBand)}`
        : null,
    `Full proposal: ${proposalUrl}`,
  ].filter((line): line is string => Boolean(line));

  const currentAddons = Array.isArray(quote.addons)
    ? quote.addons.map(String)
    : [];

  // Endowed progress: the reader arrives at step 2 of 4, not at zero.
  const journey = buildProposalJourney(quote);
  const showVolumeLadder = isVolumeLadderCustomerVisible();

  return (
    <Section className="relative" spacing="md">
      <Container size="md" className="proposal-brochure">
        <div className="mb-4 flex justify-end gap-2">
          <ShareProposalButton
            proposalUrl={proposalUrl}
            companyName={quote.company_name ?? undefined}
          />
          <a
            href={`/api/quotes/${quote.id}/one-pager-pdf`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            One-pager (PDF)
          </a>
          <PrintProposalButton />
        </div>

        <ProposalJourney journey={journey} />

        {quote.status === "accepted" && (
          <PostAcceptBanner
            contactName={quote.contact_name}
            eventDateStart={quote.event_date_start}
            portalInviteSent={shouldAutoProvisionQuote()}
          />
        )}

        <ProposalDocumentView
          doc={doc}
          quoteId={quote.id}
          priceRevealed={priceRevealed}
          canRespond={canRespond}
          walkthroughUrl={walkthroughUrl}
          validity={validity}
          expectedPlays={expectedPlays}
          expectedLeads={expectedLeads}
          showVolumeLadder={showVolumeLadder}
        />

        {/* Post-acceptance: the warmest moment to add a layer. */}
        {quote.status === "accepted" && (
          <div className="mt-16">
            <AcceptedAddOns quoteId={quote.id} currentAddons={currentAddons} />
          </div>
        )}

        {/* Share with your team — deliberately prominent, no login needed. */}
        <div className="mt-16">
          <div className="mb-4 text-center">
            <h2 className="text-heading text-xl font-bold text-foreground">
              Share this with your team
            </h2>
            <p className="mx-auto mt-1.5 max-w-[48ch] text-sm text-muted-foreground">
              No login needed — anyone with the link can read the full
              proposal. Forward it, or grab the one-page PDF for whoever signs
              it off.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <ShareProposalButton
                proposalUrl={proposalUrl}
                companyName={quote.company_name ?? undefined}
              />
              <a
                href={`/api/quotes/${quote.id}/one-pager-pdf`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
              >
                Download the one-pager (PDF)
              </a>
            </div>
          </div>
          <ChampionSummaryCard lines={summaryLines} />
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            Questions? Email{" "}
            <a href="mailto:hello@brightblue.com" className="text-primary">
              hello@brightblue.com
            </a>
          </p>
          <Link href="/" className="hover:text-foreground">
            © Bright.Blue Events · Confidential
          </Link>
        </footer>

        <div className="h-12" aria-hidden />
      </Container>
    </Section>
  );
}
