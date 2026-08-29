/**
 * Loop pulse — the growth loop's vital signs on one internal page.
 *
 * Makes the system's own claims provable: how fast an accepted quote becomes
 * a workspace, whether published reports actually get opened, the real rebook
 * rate behind the homepage's 92% line, which public artifacts send visitors
 * to /book, the fleet-wide email-capture rate, and where buyers say they
 * heard about us. Judged in quarters, not weeks — the loop converts late but
 * converts the right people.
 */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getLoopPulse } from "@/lib/queries/loop-pulse";
import { formatHours, formatPct } from "@/lib/loop-pulse";

export const metadata = {
  title: "Loop pulse",
};

function PulseCard({
  label,
  value,
  detail,
  warn = false,
}: {
  label: string;
  value: string;
  detail: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
      <p className="text-overline text-muted-foreground">{label}</p>
      <p
        className={
          warn
            ? "mt-2 text-3xl font-semibold tracking-tight text-destructive"
            : "mt-2 text-3xl font-semibold tracking-tight text-foreground"
        }
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

export default async function LoopPulsePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [pulse, unread] = await Promise.all([
    getLoopPulse(),
    getUnreadCount(user.id),
  ]);

  const {
    provisioning,
    reports,
    rebook,
    invitations,
    capture,
    referrals,
    proposals,
  } = pulse;

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Loop pulse"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/catalog" },
        { label: "Loop pulse" },
      ]}
      title="The loop's vital signs."
      subtitle="Accepted-to-provisioned time, report views, the provable rebook rate, and which public artifacts bring the next booking. Judge in quarters, not weeks."
    >
      <div className="space-y-10 py-8">
        <section>
          <EditorialEyebrow accent>The four numbers</EditorialEyebrow>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PulseCard
              label="Accepted → workspace"
              value={formatHours(provisioning.medianHours)}
              detail={
                provisioning.unprovisionedCount > 0
                  ? `${provisioning.unprovisionedCount} accepted quote${provisioning.unprovisionedCount === 1 ? "" : "s"} still waiting for a workspace — that's the money moment leaking.`
                  : `Median across ${provisioning.provisionedCount} provisioned bookings. Nothing waiting.`
              }
              warn={provisioning.unprovisionedCount > 0}
            />
            <PulseCard
              label="Reports opened"
              value={formatPct(reports.viewRatePct)}
              detail={`${reports.viewedEventCount} of ${reports.publishedCount} published reports have had their share link opened (tracked since 8 Aug 2026).`}
            />
            <PulseCard
              label="Rebook rate"
              value={formatPct(rebook.ratePct)}
              detail={`${rebook.accountsRebooked} of ${rebook.accountsWithCompleted} accounts with a completed event booked again. ${rebook.rebookQuoteCount} one-click rebooks started.`}
            />
            <PulseCard
              label="Email capture"
              value={formatPct(capture.ratePct)}
              detail={`${capture.totalLeads.toLocaleString("en-GB")} opted-in leads from ${capture.totalPlays.toLocaleString("en-GB")} plays, fleet-wide.`}
            />
            <PulseCard
              label="Proposals opened"
              value={proposals.views.toLocaleString("en-GB")}
              detail={`${proposals.distinctProposals.toLocaleString("en-GB")} different proposals opened by buyers — silence here means links aren't landing.`}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <EditorialEyebrow>Invitation footers</EditorialEyebrow>
            <span className="text-overline text-muted-foreground">
              clicks on &ldquo;want results like this?&rdquo; by artifact
            </span>
          </div>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invitation clicks recorded yet — footers went live on the
              public report, live dashboard, sponsor pitch, venue widget, and
              player cards.
            </p>
          ) : (
            <div className="border-t border-b border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artifact</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">
                      Clicks to /book
                    </TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((row) => (
                    <TableRow key={row.artifact}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.views === null
                          ? "not tracked"
                          : row.views.toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.landings.toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatPct(row.ctrPct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <EditorialEyebrow>How buyers found us</EditorialEyebrow>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No answers yet — the optional &ldquo;How did you hear about
              us?&rdquo; question sits on the proposal intake.
            </p>
          ) : (
            <div className="max-w-lg space-y-2">
              {referrals.map((r) => {
                const max = referrals[0].count;
                return (
                  <div key={r.source} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-sm text-foreground/90">
                      {r.source}
                    </span>
                    <span
                      className="h-2 rounded-full bg-primary/60"
                      style={{
                        width: `${Math.max(6, Math.round((r.count / max) * 100))}%`,
                      }}
                      aria-hidden
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {r.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
