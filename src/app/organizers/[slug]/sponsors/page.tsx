/**
 * Organizer portal — the sponsorship book across every show.
 *
 * Read as a rate card rather than a list: grouped by show, ordered by how
 * close each one is to opening, with anything still unsold inside the selling
 * window called out. Machine inventory is perishable in a way a sponsorship
 * page rarely admits — the slot is worth nothing the day after the doors
 * close — so the page is built around the clock, not around the alphabet.
 */
import { Handshake, AlertTriangle } from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SponsorSlotRow,
  type SponsorSlotView,
} from "@/components/organizers/SponsorSlotRow";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import { getSlotsByOrganizer } from "@/lib/queries/organizers";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import {
  buildSponsorBook,
  sponsorBookTotals,
  doorsLabel,
} from "@/lib/metrics/sponsor-book";
import type { MachineMission } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

function first(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

export default async function OrganizerSponsorsPage({ params }: Props) {
  const { slug } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const [rows, unread] = await Promise.all([
    getSlotsByOrganizer(partnerId),
    getUnreadCount(user.id),
  ]);

  const slots: SponsorSlotView[] = rows.map((row) => {
    const machine = first(row.machine_instances);
    return {
      id: String(row.id),
      eventId: row.event_id ? String(row.event_id) : null,
      showName: String(row.show_name),
      showHref: row.event_id
        ? `/organizers/${slug}/shows/${String(row.event_id)}`
        : null,
      machineHref:
        row.event_id && row.machine_instance_id
          ? `/organizers/${slug}/shows/${String(row.event_id)}/machines/${String(
              row.machine_instance_id
            )}`
          : null,
      sponsorName: row.sponsor_name ? String(row.sponsor_name) : null,
      status: String(row.status),
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      price: row.price != null ? Number(row.price) : null,
      pitchToken: row.pitch_token ? String(row.pitch_token) : null,
      pitchTokenExpiresAt: row.pitch_token_expires_at
        ? String(row.pitch_token_expires_at)
        : null,
      zone: machine?.zone ? String(machine.zone) : null,
      mission: (machine?.mission as MachineMission | null) ?? null,
      machineLabel: machine
        ? String(machine.nickname ?? machine.serial_number ?? "")
        : null,
    };
  });

  const book = buildSponsorBook(slots);
  const totals = sponsorBookTotals(book);

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section="Sponsors"
      slug={slug}
      tabs={organizerTabs(slug)}
      title="Sponsor inventory"
      subtitle="Every machine you can sell, who has it, and the private link you pitch it with."
      heroRight={
        totals.atRisk > 0 ? (
          <Badge className="border-0 bg-warning/10 text-warning">
            {totals.atRisk} unsold with the clock running
          </Badge>
        ) : undefined
      }
    >
      {slots.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Sponsor inventory"
          description="Open slots you can pitch to sponsors appear here, grouped by show, with a private link for each. No machines have been opened as inventory yet."
          action={{ label: "View Shows", href: `/organizers/${slug}/shows` }}
          tone="flat"
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">
              Sold{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoneyFromPence(totals.soldValue)}
              </span>
            </span>
            <span className="text-muted-foreground">
              Still available{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoneyFromPence(totals.openValue)}
              </span>
            </span>
            <span className="text-muted-foreground">
              {totals.sold} of {totals.slots} slot
              {totals.slots === 1 ? "" : "s"} taken
            </span>
          </div>

          <div className="space-y-8">
            {book.map((show) => (
              <section key={show.eventId ?? show.showName}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-heading text-sm font-semibold text-foreground">
                      {show.showName}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateShort(show.startDate)} ·{" "}
                      {doorsLabel(show.daysToDoors)} · {show.soldCount} of{" "}
                      {show.slots.length} sold
                      {show.openValue > 0
                        ? ` · ${formatMoneyFromPence(show.openValue)} still on the table`
                        : ""}
                    </p>
                  </div>
                  {show.atRiskCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                      <AlertTriangle size={12} />
                      {show.atRiskCount} need
                      {show.atRiskCount === 1 ? "s" : ""} attention
                    </span>
                  )}
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border/50">
                      {show.slots.map((slot) => (
                        <SponsorSlotRow
                          key={slot.id}
                          slot={slot}
                          urgency={slot.urgency}
                          daysToDoors={slot.daysToDoors}
                          hideShowName
                        />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Pitch links are private, expire automatically, and show aggregate
            performance only. Captured contact details go to the sponsor
            directly under their own consent notice.
          </p>
        </>
      )}
    </PortalPageShell>
  );
}
