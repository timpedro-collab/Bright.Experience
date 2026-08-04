/**
 * Internal deal-registration review queue.
 *
 * Every organizer-registered sponsor conversation lands here for a decision
 * inside the 24-hour SLA. Approving starts the 14-day exclusivity clock;
 * rejecting sends the typed reason straight to the organizer's portal. The
 * queue keeps pending rows on top because that clock is the whole point.
 */
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DealReviewControls } from "./DealReviewControls";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import {
  DEAL_STATUS_LABELS,
  exclusivityDaysRemaining,
} from "@/lib/deal-registrations";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getDealRegistrationsForAdmin,
  type AdminDealRow,
} from "@/lib/queries/deal-registrations";

export default async function AdminDealsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [deals, unread] = await Promise.all([
    getDealRegistrationsForAdmin(),
    getUnreadCount(user.id),
  ]);

  const pending = deals.filter((d) => d.status === "pending");
  const decided = deals.filter((d) => d.status !== "pending");

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Deals"
      title="Deal registrations."
      subtitle="Organizer claims on sponsor conversations. Answer inside 24 hours — approval locks the sponsor to them for 14 days."
      heroRight={
        pending.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {pending.length}
            </span>{" "}
            awaiting review
          </div>
        ) : null
      }
    >
      <div className="space-y-8 py-8">
        {deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No registrations yet"
            description="When an organizer registers a sponsor conversation, it lands here for a decision inside the 24-hour SLA."
          />
        ) : (
          <>
            <section>
              <EditorialEyebrow>Awaiting review</EditorialEyebrow>
              {pending.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Queue is clear — every registration has an answer.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {pending.map((deal) => (
                    <DealRow key={deal.id} deal={deal} reviewable />
                  ))}
                </ul>
              )}
            </section>

            {decided.length > 0 && (
              <section>
                <EditorialEyebrow>Decided</EditorialEyebrow>
                <ul className="mt-4 space-y-3">
                  {decided.map((deal) => (
                    <DealRow key={deal.id} deal={deal} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </AdminPageShell>
  );
}

function DealRow({
  deal,
  reviewable = false,
}: {
  deal: AdminDealRow;
  reviewable?: boolean;
}) {
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
              <Badge variant="outline" className="text-[0.65rem]">
                {DEAL_STATUS_LABELS[deal.status]}
              </Badge>
              {deal.source === "reverse" && (
                <Badge variant="outline" className="text-[0.65rem]">
                  Pushed lead
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {deal.partnerName} · registered {formatDateShort(deal.createdAt)}
              {deal.sponsorContactName ? ` · ${deal.sponsorContactName}` : ""}
              {deal.sponsorContactEmail ? ` (${deal.sponsorContactEmail})` : ""}
            </p>
            {deal.notes && (
              <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                “{deal.notes}”
              </p>
            )}
            {deal.status === "approved" && daysLeft !== null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Window closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}.
              </p>
            )}
            {deal.status === "rejected" && deal.rejectedReason && (
              <p className="mt-2 text-xs text-muted-foreground">
                Rejected: {deal.rejectedReason}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            {deal.estimatedValue !== null && (
              <p className="text-heading text-lg font-semibold tabular-nums text-foreground">
                {formatMoneyFromPence(deal.estimatedValue)}
              </p>
            )}
            {reviewable && (
              <DealReviewControls
                registrationId={deal.id}
                sponsorCompany={deal.sponsorCompany}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
