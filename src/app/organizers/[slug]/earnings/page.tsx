/**
 * Organizer portal — sponsorship earnings and rev-share statement.
 *
 * Accrued margin on sold slots and pipeline on reserved holds, with a
 * printable statement the organizer can keep as a payout record.
 */
import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { EarningsSummary } from "@/components/organizers/EarningsSummary";
import { PrintButton } from "@/components/organizers/PrintButton";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import { getEarningsByOrganizer } from "@/lib/queries/organizer-earnings";
import type { EarningsSlot } from "@/lib/queries/organizer-earnings";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import { formatMarginRatio } from "@/lib/pricing/slot-economics";
import { entityTitle, getPartnerNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

function moneyCell(pence: number | null): string {
  return pence !== null ? formatMoneyFromPence(pence) : "—";
}

function marginCell(slot: EarningsSlot): string {
  if (slot.marginPence === null) return "—";
  const ratio = formatMarginRatio(
    slot.rackPence !== null && slot.rackPence > 0
      ? slot.marginPence / slot.rackPence
      : null
  );
  const amount = formatMoneyFromPence(slot.marginPence);
  return ratio ? `${amount} (${ratio})` : amount;
}

function groupSlotsByShow(slots: EarningsSlot[]) {
  const groups: Array<{ eventId: string; showName: string; slots: EarningsSlot[] }> =
    [];
  const indexByEvent = new Map<string, number>();

  for (const slot of slots) {
    const existingIndex = indexByEvent.get(slot.eventId);
    if (existingIndex !== undefined) {
      groups[existingIndex].slots.push(slot);
      continue;
    }
    indexByEvent.set(slot.eventId, groups.length);
    groups.push({
      eventId: slot.eventId,
      showName: slot.showName,
      slots: [slot],
    });
  }

  return groups;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Earnings", await getPartnerNameForTitle(slug)) };
}

export default async function OrganizerEarningsPage({ params }: Props) {
  const { slug } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const [earnings, unread] = await Promise.all([
    getEarningsByOrganizer(partnerId),
    getUnreadCount(user.id),
  ]);

  const showGroups = groupSlotsByShow(earnings.slots);

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section="Earnings"
      slug={slug}
      tabs={organizerTabs(slug)}
      title="Earnings"
      subtitle="What your sponsorship book earns you — accrued and in pipeline."
    >
      {earnings.slots.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No sponsorship inventory yet"
          description="Earnings appear here once your shows carry sponsorship slots. Open inventory from a show when machines are ready to sell."
          action={{ label: "View Shows", href: `/organizers/${slug}/shows` }}
          tone="flat"
        />
      ) : (
        <>
          <EarningsSummary earnings={earnings} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-heading text-sm font-semibold text-foreground">
              Statement
            </h2>
            <PrintButton label="Print statement" />
          </div>

          <div className="space-y-8">
            {showGroups.map((show) => (
              <section key={show.eventId}>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {show.showName}
                </h3>
                <Card>
                  <CardContent className="overflow-x-auto p-0">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Sponsor</th>
                          <th className="px-4 py-3 font-medium">Dates</th>
                          <th className="px-4 py-3 font-medium">Sponsor price</th>
                          <th className="px-4 py-3 font-medium">Your cost</th>
                          <th className="px-4 py-3 font-medium">Your margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {show.slots.map((slot) => (
                          <tr
                            key={slot.slotId}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="px-4 py-3 text-foreground">
                              {slot.sponsorName ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDateShort(slot.startDate)} –{" "}
                              {formatDateShort(slot.endDate)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-foreground">
                              {moneyCell(slot.rackPence)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-foreground">
                              {moneyCell(slot.wholesalePence)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-foreground">
                              {marginCell(slot)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Wholesale figures are what Bright.Blue invoices you for each sold
            slot. Margin is yours.
          </p>
        </>
      )}
    </PortalPageShell>
  );
}
