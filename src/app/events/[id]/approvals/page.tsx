/**
 * Customer approvals — every deliverable awaiting the customer's sign-off
 * (or already decided). Editorial Bright.Experience design language:
 * EditionShell + RidgeHero + hairline-grouped rows, no glass cards.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { ApprovalStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";
import {
  RequestApprovalForm,
  type ProofOption,
} from "@/components/approvals/RequestApprovalForm";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getEventById } from "@/lib/queries/events";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole, canRequestApproval } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { formatDateMedium } from "@/lib/dates";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { Approval } from "@/types";
import { entityTitle, getEventNameForTitle } from "@/lib/queries/page-titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: entityTitle("Approvals", await getEventNameForTitle(id)) };
}

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "approvals")) redirect(`/events/${id}`);
  const canRequest = isInternalRole(user.role) && canRequestApproval(user.role);
  const [event, approvals, unread, assets] = await Promise.all([
    getEventById(id),
    getApprovalsByEvent(id),
    getUnreadCount(user.id),
    // Only the roles that can post a proof need the asset list to pick from.
    canRequest ? getAssetsByEvent(id) : Promise.resolve([]),
  ]);
  if (!event) return notFound();
  const isInternal = isInternalRole(user.role);
  const accountName = event.account.name;
  const proofOptions: ProofOption[] = assets
    .filter((asset) => asset.filePath)
    .map((asset) => ({
      id: asset.id,
      name: asset.fileName ? `${asset.name} — ${asset.fileName}` : asset.name,
      path: asset.filePath!,
    }));

  const pending = approvals.filter(
    (a) => a.status === "pending" || a.status === "revision_requested",
  );
  const decided = approvals.filter(
    (a) => a.status === "approved" || a.status === "rejected",
  );

  const subtitle =
    approvals.length === 0
      ? isInternal
        ? `Sign-off items will appear here once creative deliverables are sent to ${accountName} for review.`
        : "Approval requests will appear here once creative deliverables are ready for your review."
      : pending.length > 0
        ? isInternal
          ? `${pending.length} item${pending.length === 1 ? "" : "s"} waiting on ${accountName} to approve or request changes.`
          : `${pending.length} item${pending.length === 1 ? "" : "s"} need your review. Approve or request a revision to keep delivery moving.`
        : "All deliverables have been reviewed. Nice work.";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Approvals"
      title={isInternal ? "Customer sign-off." : "Sign-off."}
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
      {canRequest && (
        <div className="pt-8">
          <CollapsibleSection
            title="Send a proof for sign-off"
            defaultOpen={pending.length === 0}
          >
            <RequestApprovalForm eventId={id} proofOptions={proofOptions} />
          </CollapsibleSection>
        </div>
      )}

      {approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No approvals pending"
          description={
            isInternal
              ? `Sign-off items will appear here once creative deliverables are sent to ${accountName}.`
              : "Approval requests will appear here once creative deliverables are ready for your review."
          }
          action={
            isInternal
              ? { label: "Open Timeline", href: `/events/${id}/timeline` }
              : { label: "Return to Overview", href: `/events/${id}` }
          }
        />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="py-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <EditorialEyebrow accent>
                  {isInternal ? "Awaiting customer review" : "Awaiting your review"}
                </EditorialEyebrow>
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
                    isInternal={isInternal}
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
      <AutoRefresh />
    </EventPageShell>
  );
}

function ApprovalRow({
  approval,
  showActions = false,
  isInternal = false,
}: {
  approval: Approval;
  showActions?: boolean;
  isInternal?: boolean;
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
            Requested <TimeAgo dateStr={approval.requestedAt} />
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
            {isInternal ? (
              <details className="md:text-left md:min-w-[18rem]">
                <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4">
                  Waiting on customer · Record their decision
                </summary>
                <ApprovalActions
                  approvalId={approval.id}
                  eventId={approval.eventId}
                  onBehalf
                />
              </details>
            ) : (
              <ApprovalActions
                approvalId={approval.id}
                eventId={approval.eventId}
              />
            )}
          </div>
        )}
      </div>
    </li>
  );
}
