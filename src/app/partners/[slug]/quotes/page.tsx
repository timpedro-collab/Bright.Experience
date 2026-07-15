/** Partner quote pipeline — open proposals to chase and the ones you've won. */
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getPartnerPipeline } from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PortalPageShell, partnerTabs } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerQuoteForm } from "@/components/partners/PartnerQuoteForm";
import { PartnerDealList } from "@/components/partners/PartnerPipeline";

interface QuotesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerQuotesPage({ params }: QuotesPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const [deals, unread] = await Promise.all([
    getPartnerPipeline(partner.id),
    getUnreadCount(user.id),
  ]);
  const partnerName = String(partner.name ?? "Partner");

  // Open = still a quote awaiting a decision; won = converted to a live event.
  const open = deals.filter((d) => d.kind === "quote" && d.status === "pending");
  const won = deals.filter((d) => d.kind === "event");

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Quotes"
      slug={slug}
      tabs={partnerTabs(slug, user.role)}
      title="Quote pipeline"
      subtitle="Send a new quote, chase the open ones, and watch them convert."
    >
      <div className="mb-6">
        <PartnerQuoteForm slug={slug} />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes in your pipeline"
          description="Quotes you send or that come through your partner link will appear here."
          size="sm"
        />
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                Open — awaiting a decision
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                  {open.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {open.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Nothing waiting on a client right now — nice work.
                </p>
              ) : (
                <PartnerDealList deals={open} />
              )}
            </CardContent>
          </Card>

          {won.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  Converted to live events
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    {won.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PartnerDealList deals={won} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PortalPageShell>
  );
}
