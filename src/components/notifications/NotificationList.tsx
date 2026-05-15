/** Grouped notification list with read/unread state & navigation. */
"use client";

import { useMemo, useTransition } from "react";
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
import type { Notification } from "@/types";

interface NotificationListProps {
  notifications: Notification[];
}

/**
 * Map the canonical archetype kind (or legacy type) to an icon + tone. The
 * lookups are best-effort — anything we don't recognise falls back to the
 * bell glyph and a neutral tone.
 */
const KIND_ICONS: Record<string, LucideIcon> = {
  "stage.changed": CalendarClock,
  stage_change: CalendarClock,
  "approval.requested": CheckCircle2,
  "approval.approved": CheckCircle2,
  "approval.revision_requested": AlertCircle,
  approval_decision: CheckCircle2,
  "asset.upload_needed": Upload,
  "asset.review_needed": Upload,
  "asset.revision_requested": AlertCircle,
  "asset.review_approved": CheckCircle2,
  asset_uploaded: Upload,
  "briefing.needed": Sparkles,
  "briefing.submitted": Sparkles,
  "proposal.intake_received": Sparkles,
  "proposal.delivered": Sparkles,
  "quote.accepted": CheckCircle2,
  "studio.request_submitted": Sparkles,
  "studio.status_changed": Sparkles,
  studio_update: Sparkles,
  "message.received": MessageCircle,
  message_received: MessageCircle,
  message: MessageCircle,
  "task.assigned": Bell,
  "task.overdue": AlertCircle,
  deadline_approaching: Bell,
};

function iconFor(notification: Notification): LucideIcon {
  return (
    KIND_ICONS[notification.kind ?? ""] ?? KIND_ICONS[notification.type] ?? Bell
  );
}

function toneFor(notification: Notification): string {
  if (notification.actionRequired) {
    return "text-warning border-warning/30 bg-warning/10";
  }
  const key = notification.kind ?? notification.type;
  if (key.startsWith("approval.") || key === "approval_decision") {
    return "text-success border-success/30 bg-success/10";
  }
  if (key.startsWith("stage.") || key === "stage_change") {
    return "text-info border-info/30 bg-info/10";
  }
  return "text-primary border-primary/30 bg-primary/10";
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

  const { actionItems, fyi } = useMemo(() => {
    const a: Notification[] = [];
    const f: Notification[] = [];
    for (const n of notifications) {
      if (n.actionRequired) a.push(n);
      else f.push(n);
    }
    return { actionItems: a, fyi: f };
  }, [notifications]);

  const fyiByRecency = useMemo(
    () => groupBy(fyi, (n) => recencyKey(n.createdAt)),
    [fyi]
  );

  function handleClick(notification: Notification) {
    startTransition(() => {
      if (notification.link) router.push(notification.link);
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      {actionItems.length > 0 && (
        <section aria-labelledby="action-items-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2
              id="action-items-heading"
              className="text-overline text-warning"
            >
              Awaiting you · {actionItems.length}
            </h2>
            <p className="text-xs text-muted-foreground">
              These need a quick action before things can move forward.
            </p>
          </div>
          <div className="space-y-2">
            {actionItems.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleClick(notification)}
              />
            ))}
          </div>
        </section>
      )}

      {fyi.length > 0 && (
        <section aria-labelledby="fyi-heading" className="space-y-8">
          <h2 id="fyi-heading" className="text-overline text-muted-foreground">
            FYI · {fyi.length}
          </h2>
          {RECENCY_ORDER.filter((key) => fyiByRecency[key]?.length).map(
            (key) => (
              <section key={key} className="space-y-2">
                <h3 className="text-overline text-muted-foreground mb-2">
                  {key}
                </h3>
                <div className="space-y-2">
                  {fyiByRecency[key].map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleClick(notification)}
                    />
                  ))}
                </div>
              </section>
            )
          )}
        </section>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = iconFor(notification);
  const tone = toneFor(notification);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-4 rounded-[var(--radius-card)] border border-white/[0.06]",
        "bg-[hsl(233,56%,11%,0.5)] backdrop-blur-md p-4 text-left",
        "transition-all hover:border-white/16 hover:bg-[hsl(233,56%,11%,0.7)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !notification.isRead && "ring-1 ring-primary/30",
        notification.actionRequired &&
          !notification.isRead &&
          "ring-1 ring-warning/40"
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border",
          tone
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              notification.isRead
                ? "text-muted-foreground"
                : "text-foreground font-medium"
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {timeSince(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        )}
      </div>
      {!notification.isRead && (
        <span
          className={cn(
            "mt-2 h-2 w-2 shrink-0 rounded-full",
            notification.actionRequired
              ? "bg-warning shadow-[0_0_8px_hsl(38,100%,50%,0.6)]"
              : "bg-primary shadow-[0_0_8px_hsl(223,94%,53%,0.6)]"
          )}
        />
      )}
    </button>
  );
}
