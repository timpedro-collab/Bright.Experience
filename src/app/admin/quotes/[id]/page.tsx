/** Internal proposal builder — add line items and send proposal. */
import { redirect, notFound } from "next/navigation";

import { CalendarCheck } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/quotes/QuoteStatusBadge";
import { WalkthroughControl } from "@/components/quotes/proposal/WalkthroughControl";
import { ConvertToEventCard } from "@/components/quotes/ConvertToEventCard";
import { PushLeadCard } from "@/components/quotes/PushLeadCard";
import { ProposalBuilder } from "./ProposalBuilder";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getQuoteById } from "@/lib/queries/quotes";
import { getOrganizerPartners } from "@/lib/queries/organizer-admin";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Quote detail",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [quote, unread, organizers] = await Promise.all([
    getQuoteById(id),
    getUnreadCount(user.id),
    getOrganizerPartners(),
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
        {quote.walkthrough_scheduled_at && (
          <Card tone="elevated" className="border-success/30 bg-success/15">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
                <CalendarCheck className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-overline text-success">Walkthrough booked</p>
                <p className="text-sm font-semibold text-foreground">
                  {quote.walkthrough_slot_label ??
                    new Date(quote.walkthrough_scheduled_at as string).toLocaleString("en-GB", {
                      weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                    })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quote.contact_name} is expecting your call. Have the tailored proposal ready to walk through live.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WalkthroughControl
            quoteId={quote.id}
            initialUrl={quote.walkthrough_url ?? null}
            completedAt={quote.walkthrough_completed_at ?? null}
          />
          <ConvertToEventCard
            quoteId={quote.id}
            status={quote.status}
            eventId={quote.event_id ?? null}
            contactName={quote.contact_name}
          />
        </div>
        <PushLeadCard
          quoteId={quote.id}
          companyName={quote.company_name ?? quote.contact_name}
          organizers={organizers.map((o) => ({ id: o.id, name: o.name }))}
        />
        <ProposalBuilder quote={quote} />
      </div>
    </AdminPageShell>
  );
}
