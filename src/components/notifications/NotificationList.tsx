/**
 * Grouped notification list — the editorial row-based design used on
 * the Bright.Experience notification surfaces.
 *
 * Two visual groups, separated by a hairline:
 *
 *   1) Awaiting you · N      — anything `actionRequired: true`
 *      Each row gets a cobalt left-edge stripe and a small unread dot.
 *
 *   2) FYI · N               — everything else, sub-grouped by recency
 *      ("Today" / "Yesterday" / "Earlier this week" / etc).
 *
 * Each row is a clean horizontal line item:
 *   ▍ [icon] ARCHETYPE EYEBROW      message body            2m ago
 *
 * No glass card, no rounded chunky containers — just calm editorial
 * rows that match the rest of the design language (hairlines, tracked
 * uppercase metadata, italic-underlined CTAs).
 */
"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Upload,
  CalendarClock,
  MessageCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { timeSince } from "@/lib/dates";
import { markRead } from "@/app/actions/notifications";
import type { Notification } from "@/types";

interface NotificationListProps {
  notifications: Notification[];
}

/**
 * Map archetype kind (or legacy type) → glyph + short label. The label
 * surfaces as the tracked uppercase eyebrow on the row so the user can
 * scan vertically by topic. Unknown kinds get a neutral "Update".
 */
const ARCHETYPE: Record<string, { icon: LucideIcon; label: string }> = {
  "stage.changed": { icon: CalendarClock, label: "Stage" },
  stage_change: { icon: CalendarClock, label: "Stage" },
  "approval.requested": { icon: CheckCircle2, label: "Approval" },
  "approval.approved": { icon: CheckCircle2, label: "Approval" },
  "approval.revision_requested": { icon: AlertCircle, label: "Revision" },
  approval_decision: { icon: CheckCircle2, label: "Approval" },
  "asset.upload_needed": { icon: Upload, label: "Asset" },
  "asset.review_needed": { icon: Upload, label: "Asset review" },
  "asset.revision_requested": { icon: AlertCircle, label: "Revision" },
  "asset.review_approved": { icon: CheckCircle2, label: "Approved" },
  asset_uploaded: { icon: Upload, label: "Asset" },
  "briefing.needed": { icon: Sparkles, label: "Briefing" },
  "briefing.submitted": { icon: Sparkles, label: "Briefing" },
  "proposal.intake_received": { icon: Sparkles, label: "Proposal" },
  "proposal.delivered": { icon: Sparkles, label: "Proposal" },
  "quote.accepted": { icon: CheckCircle2, label: "Quote" },
  "studio.request_submitted": { icon: Sparkles, label: "Studio" },
  "studio.status_changed": { icon: Sparkles, label: "Studio" },
  studio_update: { icon: Sparkles, label: "Studio" },
  "message.received": { icon: MessageCircle, label: "Message" },
  message_received: { icon: MessageCircle, label: "Message" },
  message: { icon: MessageCircle, label: "Message" },
  "task.assigned": { icon: Bell, label: "Task" },
  "task.overdue": { icon: AlertCircle, label: "Task overdue" },
  deadline_approaching: { icon: Bell, label: "Deadline" },
};

function archetypeFor(notification: Notification): {
  icon: LucideIcon;
  label: string;
} {
  return (
    ARCHETYPE[notification.kind ?? ""] ??
    ARCHETYPE[notification.type] ?? { icon: Bell, label: "Update" }
  );
}

function groupBy<T>(arr: T[], by: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = by(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

function recencyKey(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (daysAgo < 1) return "Today";
  if (daysAgo < 2) return "Yesterday";
  if (daysAgo < 7) return "Earlier this week";
  if (daysAgo < 30) return "Earlier this month";
  return "Older";
}

const RECENCY_ORDER = [
  "Today",
  "Yesterday",
  "Earlier this week",
  "Earlier this month",
  "Older",
] as const;

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // The unread dot clears the instant a row is clicked — the server action
  // reconciles in the background and React reverts on failure.
  const [optimisticNotifications, markOptimisticRead] = useOptimistic(
    notifications,
    (state: Notification[], id: string) =>
      state.map((n) => (n.id === id ? { ...n, isRead: true } : n))
  );

  const { actionItems, fyi } = useMemo(() => {
    const a: Notification[] = [];
    const f: Notification[] = [];
    for (const n of optimisticNotifications) {
      if (n.actionRequired) a.push(n);
      else f.push(n);
    }
    return { actionItems: a, fyi: f };
  }, [optimisticNotifications]);

  const fyiByRecency = useMemo(
    () => groupBy(fyi, (n) => recencyKey(n.createdAt)),
    [fyi],
  );

  function handleClick(notification: Notification) {
    startTransition(async () => {
      if (!notification.isRead) {
        markOptimisticRead(notification.id);
        await markRead(notification.id);
      }
      if (notification.link) router.push(notification.link);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-12">
      {actionItems.length > 0 && (
        <section aria-labelledby="action-items-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2
              id="action-items-heading"
              className="text-overline text-[var(--color-bb-cobalt)]"
            >
              Awaiting you · {actionItems.length}
            </h2>
            <p className="text-overline text-muted-foreground">
              Need a quick action
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
            {actionItems.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={() => handleClick(notification)}
              />
            ))}
          </ul>
        </section>
      )}

      {fyi.length > 0 && (
        <section aria-labelledby="fyi-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="fyi-heading" className="text-overline text-muted-foreground">
              FYI · {fyi.length}
            </h2>
            <p className="text-overline text-muted-foreground">
              Updates from your events
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {RECENCY_ORDER.filter((key) => fyiByRecency[key]?.length).map(
              (key) => (
                <section key={key}>
                  <h3 className="text-overline text-muted-foreground mb-2 opacity-70">
                    {key}
                  </h3>
                  <ul className="flex flex-col divide-y divide-border/30 border-t border-b border-border/30">
                    {fyiByRecency[key].map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleClick(notification)}
                      />
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const { icon: Icon, label } = archetypeFor(notification);
  const isUnread = !notification.isRead;
  const isAction = notification.actionRequired;

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative flex w-full items-start gap-4 py-3.5 pl-3 pr-2 text-left",
          "transition-colors hover:bg-accent/30",
          "focus-visible:outline-none focus-visible:bg-accent/40",
        )}
      >
        {/* Left edge stripe: cobalt for action+unread, transparent otherwise. */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-2 bottom-2 w-[2px] rounded-full",
            isAction && isUnread
              ? "bg-[var(--color-bb-cobalt)]"
              : "bg-transparent",
          )}
        />

        {/* Glyph badge — small editorial square. */}
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card/60",
            isAction && "text-[var(--color-bb-cobalt)]",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-overline whitespace-nowrap",
                isAction
                  ? "text-[var(--color-bb-cobalt)]"
                  : "text-muted-foreground",
              )}
            >
              {isUnread && (
                <span
                  aria-label="Unread"
                  className={cn(
                    "inline-block mr-1.5 h-1.5 w-1.5 rounded-full align-middle",
                    isAction
                      ? "bg-[var(--color-bb-cobalt)]"
                      : "bg-primary",
                  )}
                />
              )}
              {label}
            </span>
          </div>
          <p
            className={cn(
              "text-sm leading-snug",
              isUnread ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {notification.title}
          </p>
          {notification.body && (
            <p className="line-clamp-1 text-xs text-muted-foreground opacity-80">
              {notification.body}
            </p>
          )}
        </div>

        <span className="text-overline text-muted-foreground tabular-nums whitespace-nowrap pt-0.5">
          {timeSince(notification.createdAt)}
        </span>
      </button>
    </li>
  );
}
