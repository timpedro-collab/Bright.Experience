import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getEventById } from "@/lib/queries/events";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";
import type { Approval } from "@/types";
import { formatDateMedium, timeSince } from "@/lib/dates";

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
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const pending = approvals.filter(
    (a) => a.status === "pending" || a.status === "revision_requested"
  );
  const decided = approvals.filter(
    (a) => a.status === "approved" || a.status === "rejected"
  );

  if (approvals.length === 0) {
    return (
      <AppShell
        eventId={id}
        user={user}
        isInternal={isInternal}
        notificationCount={unread}
      >
        <EventContextBar event={event} currentSection="Approvals" />
        <PageHeader
          eyebrow="Review queue"
          title="Approvals"
          subtitle="Review and approve deliverables for your event."
        />
        <EmptyState
          icon={CheckCircle2}
          title="No approvals pending"
          description="Approval requests will appear here once creative deliverables are ready for your review."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Approvals" />
      <PageHeader
        eyebrow="Review queue"
        title="Approvals"
        subtitle={
          pending.length > 0
            ? `${pending.length} item${pending.length === 1 ? "" : "s"} need your review. Approve or request a revision to keep delivery moving.`
            : "All deliverables have been reviewed. Nice work!"
        }
        actions={
          pending.length > 0 ? (
            <Badge variant="warning">{pending.length} pending</Badge>
          ) : (
            <Badge variant="success">All reviewed</Badge>
          )
        }
      />

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-overline text-muted-foreground mb-4 flex items-center gap-2">
            <Clock size={14} />
            Awaiting your review
          </h2>
          <div className="space-y-4">
            {pending.map((approval, i) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                index={i}
                showActions
              />
            ))}
          </div>
        </div>
      )}

      {decided.length > 0 && (
        <div>
          <h2 className="text-overline text-muted-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Reviewed
          </h2>
          <div className="space-y-4">
            {decided.map((approval, i) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                index={i + pending.length}
              />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ApprovalCard({
  approval,
  index,
  showActions = false,
}: {
  approval: Approval;
  index: number;
  showActions?: boolean;
}) {
  const isPending =
    approval.status === "pending" ||
    approval.status === "revision_requested";

  return (
    <Card
      tone="subtle"
      className={`stagger-item p-6 ${isPending ? "border-primary/40 shadow-[inset_3px_0_0_0_hsl(223,94%,53%)]" : ""}`}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-heading text-base font-semibold text-foreground">
              {approval.title}
            </h3>
            <ApprovalStatusBadge status={approval.status} />
          </div>
          {approval.description && (
            <p className="text-sm text-muted-foreground">
              {approval.description}
            </p>
          )}
        </div>
        <span className="text-overline text-muted-foreground shrink-0">
          {timeSince(approval.requestedAt)}
        </span>
      </div>

      {approval.previewUrl && isPending && (
        <div className="mb-4 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Eye size={24} />
            <span className="text-sm">Preview available</span>
            <button className="btn btn-ghost text-xs mt-1">
              <Eye size={14} />
              View full preview
            </button>
          </div>
        </div>
      )}

      {approval.revisionCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Revision {approval.revisionCount}
          </span>
        </div>
      )}

      {approval.feedback && (
        <div className="mb-4 p-3 rounded-[var(--radius-control)] bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-start gap-2">
            <MessageSquare
              size={12}
              className="text-muted-foreground mt-0.5 shrink-0"
            />
            <p className="text-xs text-muted-foreground">{approval.feedback}</p>
          </div>
        </div>
      )}

      {approval.decidedAt && (
        <p className="text-xs text-muted-foreground">
          {approval.status === "approved" ? "Approved" : "Rejected"} on{" "}
          {formatDateMedium(approval.decidedAt)}
        </p>
      )}

      {showActions && isPending && (
        <ApprovalActions
          approvalId={approval.id}
          eventId={approval.eventId}
        />
      )}
    </Card>
  );
}
