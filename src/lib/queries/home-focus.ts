/**
 * Home "What needs you now" focus list.
 *
 * A pure assembler that turns the data the home page already fetches
 * (portfolio stats, internal queue counts, role task groups) into one
 * normalized, prioritized list of action items per role. No new queries —
 * the home page server component fetches once and hands the results here.
 */
import type { UserRole } from "@/types";
import type { PortfolioStats } from "@/lib/queries/portfolio";
import type { InternalQueueCounts } from "@/lib/queries/admin-queues";
import type { TaskGroupByEvent } from "@/lib/queries/tasks";
import type { UpcomingWalkthrough } from "@/lib/queries/quotes";
import { isOverdue, daysUntilDate } from "@/lib/dates";

export type FocusKind =
  | "blocked_event"
  | "at_risk_event"
  | "quote"
  | "walkthrough"
  | "asset_review"
  | "studio_order"
  | "task"
  | "setup";

export type FocusTone = "critical" | "warning" | "info" | "default";

export interface FocusItem {
  id: string;
  kind: FocusKind;
  /** What needs doing. */
  title: string;
  /** Why it's here — event/account context or the reason it surfaced. */
  reason: string;
  /** Where the action is taken. */
  href: string;
  /** Short verb for the CTA (Review, Open, Resolve…). */
  cta: string;
  tone: FocusTone;
  dueDate?: string;
}

const TONE_RANK: Record<FocusTone, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  default: 3,
};

/** Roles that own portfolio health + the commercial pipeline. */
const ORCHESTRATORS: UserRole[] = ["events_lead", "admin", "developer"];
/** How far ahead an upcoming setup surfaces on the ops home. */
const SETUP_WINDOW_DAYS = 30;
const DUE_SOON_DAYS = 3;
const MAX_ITEMS = 8;

interface BuildFocusInput {
  role: UserRole;
  portfolio: PortfolioStats;
  queueCounts: InternalQueueCounts | null;
  taskGroups: TaskGroupByEvent[];
  walkthroughs?: UpcomingWalkthrough[];
}

/**
 * Assemble the prioritized "needs you now" list for an internal role.
 * Cross-event signals (blocked events, queues, setups) come first, then
 * the viewer's own open tasks. Sorted by urgency, then due date.
 */
export function buildFocusItems({
  role,
  portfolio,
  queueCounts,
  taskGroups,
  walkthroughs = [],
}: BuildFocusInput): FocusItem[] {
  const items: FocusItem[] = [];

  if (ORCHESTRATORS.includes(role)) {
    for (const e of portfolio.events) {
      if (e.healthStatus === "red") {
        items.push({
          id: `blocked-${e.id}`,
          kind: "blocked_event",
          title: e.name,
          reason: `Blocked · ${e.account.name}`,
          href: `/events/${e.id}`,
          cta: "Resolve",
          tone: "critical",
          dueDate: e.eventDateStart,
        });
      } else if (e.healthStatus === "amber") {
        items.push({
          id: `risk-${e.id}`,
          kind: "at_risk_event",
          title: e.name,
          reason: `At risk · ${e.account.name}`,
          href: `/events/${e.id}`,
          cta: "Open",
          tone: "warning",
          dueDate: e.eventDateStart,
        });
      }
    }
    if (queueCounts && queueCounts.newQuotes > 0) {
      items.push({
        id: "quotes",
        kind: "quote",
        title: `${queueCounts.newQuotes} quote request${queueCounts.newQuotes === 1 ? "" : "s"} to action`,
        reason: "Customers waiting on a proposal",
        href: "/admin/quotes",
        cta: "Review",
        tone: "info",
      });
    }
    for (const w of walkthroughs) {
      const dateOnly = w.scheduledAt.split("T")[0];
      const days = daysUntilDate(dateOnly);
      items.push({
        id: `walkthrough-${w.id}`,
        kind: "walkthrough",
        title: `Walkthrough · ${w.contactName}`,
        reason: w.slotLabel
          ? `Booked for ${w.slotLabel}`
          : `Booked${w.companyName ? ` · ${w.companyName}` : ""}`,
        href: `/admin/quotes/${w.id}`,
        cta: "Prep",
        tone: days <= 2 ? "warning" : "info",
        dueDate: dateOnly,
      });
    }
  }

  if (role === "creative_lead") {
    if (queueCounts && queueCounts.assetReviews > 0) {
      const overdue = queueCounts.overdueAssetReviews ?? 0;
      items.push({
        id: "asset-reviews",
        kind: "asset_review",
        title: `${queueCounts.assetReviews} asset${queueCounts.assetReviews === 1 ? "" : "s"} awaiting sign-off`,
        reason:
          overdue > 0
            ? `${overdue} past the 2-day review SLA`
            : "Customer uploads need creative sign-off",
        href: "/admin/asset-reviews",
        cta: "Review",
        tone: overdue > 0 ? "warning" : "info",
      });
    }
    if (queueCounts && queueCounts.newStudioOrders > 0) {
      items.push({
        id: "studio-orders",
        kind: "studio_order",
        title: `${queueCounts.newStudioOrders} studio order${queueCounts.newStudioOrders === 1 ? "" : "s"} to action`,
        reason: "Submitted creative requests",
        href: "/studio",
        cta: "Open",
        tone: "info",
      });
    }
  }

  if (role === "operations_lead") {
    for (const e of portfolio.events) {
      if (!e.setupDate || e.currentStage === "complete") continue;
      const days = daysUntilDate(e.setupDate);
      if (days < 0 || days > SETUP_WINDOW_DAYS) continue;
      items.push({
        id: `setup-${e.id}`,
        kind: "setup",
        title: `Setup: ${e.name}`,
        reason: e.venueName ?? "Venue to confirm",
        href: `/events/${e.id}/logistics`,
        cta: "Plan",
        tone: days <= 7 ? "warning" : "info",
        dueDate: e.setupDate,
      });
    }
  }

  // Every internal role then sees their own open tasks across events.
  for (const group of taskGroups) {
    for (const task of group.tasks) {
      const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
      const dueSoon =
        !overdue && task.dueDate
          ? daysUntilDate(task.dueDate) <= DUE_SOON_DAYS
          : false;
      let tone: FocusTone = "default";
      if (task.priority === "critical" || overdue) tone = "critical";
      else if (task.priority === "high" || dueSoon) tone = "warning";
      items.push({
        id: `task-${task.id}`,
        kind: "task",
        title: task.title,
        reason: group.eventName,
        href: task.targetPath
          ? `/events/${group.eventId}/${task.targetPath}`
          : `/events/${group.eventId}/actions`,
        cta: "Open",
        tone,
        dueDate: task.dueDate,
      });
    }
  }

  items.sort((a, b) => {
    if (TONE_RANK[a.tone] !== TONE_RANK[b.tone]) {
      return TONE_RANK[a.tone] - TONE_RANK[b.tone];
    }
    const ad = a.dueDate ?? "9999-12-31";
    const bd = b.dueDate ?? "9999-12-31";
    if (ad !== bd) return ad.localeCompare(bd);
    return a.title.localeCompare(b.title);
  });

  return items.slice(0, MAX_ITEMS);
}
