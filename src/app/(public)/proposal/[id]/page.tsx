/** Proposal delivery page — brochure presentation with accept/decline */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Container, Section } from "@/components/ui/section";
import { getQuoteById } from "@/lib/queries/quotes";
import { ProposalHero } from "@/components/quotes/ProposalHero";
import { ProposalBreakdown } from "@/components/quotes/ProposalBreakdown";
import { ProposalOutcomes } from "@/components/quotes/ProposalOutcomes";
import { ProposalROIPanel } from "@/components/quotes/ProposalROIPanel";
import { ProposalAssetRequirements } from "@/components/quotes/ProposalAssetRequirements";
import { PostAcceptBanner } from "@/components/quotes/PostAcceptBanner";

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

  const lineItems = (quote.quote_line_items ?? []).map(
    (li: {
      id: string;
      label: string;
      amount: number;
      category?: string;
      sort_order: number;
    }) => ({
      id: li.id,
      label: li.label,
      amount: li.amount,
      category: li.category,
      sort_order: li.sort_order,
    })
  );

  const proposalNumber = quote.id.slice(0, 8).toUpperCase();
  const totalPence = quote.total_amount ?? 0;

  return (
    <Section className="relative" spacing="md">
      <Container size="md" className="proposal-brochure">
        {quote.status === "accepted" && (
          <PostAcceptBanner
            contactName={quote.contact_name}
            eventDateStart={quote.event_date_start}
          />
        )}

        <ProposalHero
          quoteId={quote.id}
          preparedForName={quote.contact_name}
          preparedForCompany={quote.company_name}
          status={quote.status}
          totalPence={totalPence}
          createdAt={quote.created_at}
          expiresAt={quote.expires_at}
          proposalNumber={proposalNumber}
        />

        <div className="mt-14 space-y-6 md:mt-20 md:space-y-8">
          <ProposalBreakdown
            lineItems={lineItems}
            totalPence={totalPence}
            notes={quote.proposal_notes}
          />

          <ProposalOutcomes
            estimatedInteractions={quote.estimated_interactions}
            estimatedLeads={quote.estimated_leads}
            estimatedImpressions={quote.estimated_impressions}
          />

          <ProposalAssetRequirements />

          <ProposalROIPanel
            totalPence={totalPence}
            estimatedLeads={quote.estimated_leads}
            eventType={quote.event_type}
          />
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            Questions? Email{" "}
            <a href="mailto:hello@brightblue.com" className="text-primary">
              hello@brightblue.com
            </a>
          </p>
          <Link href="/" className="hover:text-foreground">
            © Bright.Blue Events
          </Link>
        </footer>

        {/* Bottom padding to keep sticky bar from overlapping the footer */}
        <div className="h-24 md:h-32" aria-hidden />
      </Container>
    </Section>
  );
}
