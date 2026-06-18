/** Internal proposal builder — add line items and send proposal. */
import { redirect, notFound } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { QuoteStatusBadge } from "@/components/quotes/QuoteStatusBadge";
import { WalkthroughControl } from "@/components/quotes/proposal/WalkthroughControl";
import { ProposalBuilder } from "./ProposalBuilder";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getQuoteById } from "@/lib/queries/quotes";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [quote, unread] = await Promise.all([
    getQuoteById(id),
    getUnreadCount(user.id),
  ]);
  if (!quote) notFound();

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section={quote.contact_name}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Quotes", href: "/admin/quotes" },
        { label: quote.contact_name },
      ]}
      eyebrow={`Internal · ${quote.company_name ?? quote.contact_email}`}
      title={`Proposal for ${quote.contact_name}.`}
      subtitle="Build the line items, sanity-check the totals, and ship a proposal in under an hour."
      heroRight={<QuoteStatusBadge status={quote.status} />}
      backHref="/admin/quotes"
      backLabel="Back to queue"
    >
      <div className="py-8 space-y-8">
        <WalkthroughControl
          quoteId={quote.id}
          initialUrl={quote.walkthrough_url ?? null}
          completedAt={quote.walkthrough_completed_at ?? null}
        />
        <ProposalBuilder quote={quote} />
      </div>
    </AdminPageShell>
  );
}
