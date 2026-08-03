/** Proposal delivery page — editorial, narrative proposal with a call-first flow. */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Container, Section } from "@/components/ui/section";
import { getQuoteById } from "@/lib/queries/quotes";
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
import { PrintProposalButton } from "@/components/quotes/proposal/PrintProposalButton";
import { ShareProposalButton } from "@/components/quotes/proposal/ShareProposalButton";
import { ChampionSummaryCard } from "@/components/quotes/proposal/ChampionSummaryCard";
import { AcceptedAddOns } from "@/components/quotes/proposal/AcceptedAddOns";
import { PostAcceptBanner } from "@/components/quotes/PostAcceptBanner";
import { walkthroughUrlFor } from "@/lib/calcom";

export const metadata: Metadata = {
  title: "Your proposal",
  description: "Your bespoke Bright.Blue proposal.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

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

  return (
    <Section className="relative" spacing="md">
      <Container size="md" className="proposal-brochure">
        <div className="mb-4 flex justify-end gap-2">
          <ShareProposalButton
            proposalUrl={proposalUrl}
            companyName={quote.company_name ?? undefined}
          />
          <PrintProposalButton />
        </div>

        {quote.status === "accepted" && (
          <PostAcceptBanner
            contactName={quote.contact_name}
            eventDateStart={quote.event_date_start}
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
        />

        {/* Post-acceptance: the warmest moment to add a layer. */}
        {quote.status === "accepted" && (
          <div className="mt-16">
            <AcceptedAddOns quoteId={quote.id} currentAddons={currentAddons} />
          </div>
        )}

        <div className="mt-16">
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
