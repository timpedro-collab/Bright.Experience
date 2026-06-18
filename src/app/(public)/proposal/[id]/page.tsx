/** Proposal delivery page — editorial, narrative proposal with a call-first flow. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Container, Section } from "@/components/ui/section";
import { getQuoteById } from "@/lib/queries/quotes";
import { buildProposalDocument } from "@/lib/proposal/build-proposal";
import { ProposalDocumentView } from "@/components/quotes/proposal/ProposalDocumentView";
import { PostAcceptBanner } from "@/components/quotes/PostAcceptBanner";

export const metadata: Metadata = {
  title: "Your proposal",
  description: "Your bespoke Bright.Blue proposal.",
};

/** Fallback scheduler used until an AE sets a per-proposal link. */
const DEFAULT_WALKTHROUGH_URL = "https://cal.com/brightblue/15min";

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
  const walkthroughUrl = quote.walkthrough_url || DEFAULT_WALKTHROUGH_URL;

  return (
    <Section className="relative" spacing="md">
      <Container size="md" className="proposal-brochure">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            Download PDF
          </button>
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
        />

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
