/**
 * Organizer portal — deal registration board.
 *
 * Where an organizer claims sponsor conversations before quoting them.
 * Approval grants a 14-day exclusivity window across every channel, so the
 * board is organised around the two clocks that matter: how long until we
 * answer (24h SLA) and how long the window has left.
 */
import type { Metadata } from "next";
import { Handshake } from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RegisterDealForm } from "@/components/organizers/RegisterDealForm";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import {
  DEAL_STATUS_LABELS,
  exclusivityDaysRemaining,
  type DealRegistration,
} from "@/lib/deal-registrations";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import { getDealsByPartner } from "@/lib/queries/deal-registrations";
import { getShowsByOrganizer } from "@/lib/queries/organizers";
import { getUnreadCount } from "@/lib/queries/notifications";
import { entityTitle, getPartnerNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_BADGE_CLASSES: Record<DealRegistration["status"], string> = {
  pending: "",
  approved: "border-0 bg-success/10 text-success",
  rejected: "border-0 bg-destructive/10 text-destructive",
  converted: "border-0 bg-success/10 text-success",
  expired: "text-muted-foreground",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Deals", await getPartnerNameForTitle(slug)) };
}

export default async function OrganizerDealsPage({ params }: Props) {
  const { slug } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const [deals, shows, unread] = await Promise.all([
    getDealsByPartner(partnerId),
    getShowsByOrganizer(partnerId),
    getUnreadCount(user.id),
  ]);

  const showOptions = shows.map((s) => ({ id: s.id, name: s.name }));

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section="Deals"
      slug={slug}
      tabs={organizerTabs(slug)}
      title="Deal registration"
      subtitle="Claim a sponsor conversation before you quote it. Approval locks it to you for 14 days — across every channel, including ours."
    >
      <div className="mb-8">
        <RegisterDealForm partnerSlug={slug} shows={showOptions} />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No registered deals yet"
          description="Register a sponsor conversation and it's yours while you close it — a direct enquiry from the same company routes back to you instead of competing."
        />
      ) : (
        <ul className="space-y-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </ul>
      )}
    </PortalPageShell>
  );
}

function DealCard({ deal }: { deal: DealRegistration }) {
  const daysLeft =
    deal.status === "approved"
      ? exclusivityDaysRemaining(deal.exclusivityExpiresAt)
      : null;

  return (
    <li>
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-heading text-sm font-semibold text-foreground">
                {deal.sponsorCompany}
              </p>
              <Badge
                variant="outline"
                className={`text-[0.65rem] ${STATUS_BADGE_CLASSES[deal.status]}`}
              >
                {DEAL_STATUS_LABELS[deal.status]}
              </Badge>
              {deal.source === "reverse" && (
                <Badge variant="outline" className="text-[0.65rem]">
                  Sent to you by Bright.Blue
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Registered {formatDateShort(deal.createdAt)}
              {deal.sponsorContactName ? ` · ${deal.sponsorContactName}` : ""}
              {deal.sponsorContactEmail ? ` (${deal.sponsorContactEmail})` : ""}
            </p>
            {deal.status === "pending" && (
              <p className="mt-2 text-xs text-muted-foreground">
                With Bright.Blue for review — we answer within 24 hours.
              </p>
            )}
            {deal.status === "approved" && daysLeft !== null && (
              <p className="mt-2 text-xs font-medium text-success">
                Exclusively yours for {daysLeft} more{" "}
                {daysLeft === 1 ? "day" : "days"} — go close it.
              </p>
            )}
            {deal.status === "rejected" && deal.rejectedReason && (
              <p className="mt-2 text-xs text-muted-foreground">
                Reason: {deal.rejectedReason}
              </p>
            )}
          </div>
          {deal.estimatedValue !== null && (
            <p className="text-heading shrink-0 text-lg font-semibold tabular-nums text-foreground">
              {formatMoneyFromPence(deal.estimatedValue)}
            </p>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
