/**
 * Customer approvals — every deliverable awaiting the customer's sign-off
 * (or already decided). Editorial Bright.Experience design language:
 * EditionShell + RidgeHero + hairline-grouped rows, no glass cards.
 */

import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { ApprovalStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";

import { getEventById } from "@/lib/queries/events";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { formatDateMedium, timeSince } from "@/lib/dates";
import type { Approval } from "@/types";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, approvals, unread] = await Promise.all([
    getEventById(id),
    getApprovalsByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();
  const isInternal = isInternalRole(user.role);

  const pending = approvals.filter(
    (a) => a.status === "pending" || a.status === "revision_requested",
  );
  const decided = approvals.filter(
    (a) => a.status === "approved" || a.status === "rejected",
  );

  const subtitle =
    approvals.length === 0
      ? "Approval requests will appear here once creative deliverables are ready for your review."
      : pending.length > 0
        ? `${pending.length} item${pending.length === 1 ? "" : "s"} need your review. Approve or request a revision to keep delivery moving.`
        : "All deliverables have been reviewed. Nice work.";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Approvals"
      title="Sign-off."
      subtitle={subtitle}
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        approvals.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {decided.length}
            </span>
            <span className="opacity-60"> / {approvals.length} </span>
            decided
          </div>
        ) : null
      }
    >
      {approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No approvals pending"
          description="Approval requests will appear here once creative deliverables are ready for your review."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="py-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <EditorialEyebrow accent>Awaiting your review</EditorialEyebrow>
                <span className="text-overline text-muted-foreground tabular-nums">
                  {pending.length} pending
                </span>
              </div>
              <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                {pending.map((approval) => (
                  <ApprovalRow
                    key={approval.id}
                    approval={approval}
                    showActions
                  />
                ))}
              </ul>
            </section>
          )}

          {pending.length > 0 && decided.length > 0 && (
            <Hairline className="opacity-60" />
          )}

          {decided.length > 0 && (
            <section className="py-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <EditorialEyebrow>Already decided</EditorialEyebrow>
                <span className="text-overline text-muted-foreground tabular-nums">
                  {decided.length} done
                </span>
              </div>
              <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                {decided.map((approval) => (
                  <ApprovalRow key={approval.id} approval={approval} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </EventPageShell>
  );
}

function ApprovalRow({
  approval,
  showActions = false,
}: {
  approval: Approval;
  showActions?: boolean;
}) {
  const isPending =
    approval.status === "pending" ||
    approval.status === "revision_requested";

  return (
    <li className="relative py-5 pl-3 pr-2">
      {/* Left accent stripe */}
      <span
        aria-hidden
        className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-full ${
          isPending
            ? "bg-[var(--color-bb-cobalt)]"
            : approval.status === "approved"
              ? "bg-success/40"
              : "bg-destructive/40"
        }`}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-foreground">
              {approval.title}
            </h3>
            <ApprovalStatusBadge status={approval.status} />
            {approval.revisionCount > 0 && (
              <span className="inline-flex items-center gap-1 text-overline text-muted-foreground">
                <RefreshCw className="size-3" /> Rev {approval.revisionCount}
              </span>
            )}
          </div>

          {approval.description && (
            <p className="text-sm text-muted-foreground leading-snug mt-0.5 max-w-[60ch]">
              {approval.description}
            </p>
          )}

          {approval.feedback && (
            <div className="mt-3 border-l-2 border-border/60 pl-3 py-1">
              <p className="text-overline text-muted-foreground mb-0.5 inline-flex items-center gap-1">
                <MessageSquare className="size-3" /> Feedback
              </p>
              <p className="text-sm text-foreground/90 leading-snug whitespace-pre-line">
                {approval.feedback}
              </p>
            </div>
          )}

          {approval.previewUrl && isPending && (
            <a
              href={approval.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4"
            >
              <Eye className="size-3" /> View preview
            </a>
          )}

          <p className="mt-2 text-overline text-muted-foreground">
            Requested {timeSince(approval.requestedAt)}
            {approval.decidedAt && (
              <>
                <span className="opacity-60"> · </span>
                {approval.status === "approved" ? "Approved" : "Decided"}{" "}
                {formatDateMedium(approval.decidedAt)}
              </>
            )}
          </p>
        </div>

        {showActions && isPending && (
          <div className="md:text-right">
            <ApprovalActions
              approvalId={approval.id}
              eventId={approval.eventId}
            />
          </div>
        )}
      </div>
    </li>
  );
}
