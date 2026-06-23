/**
 * NeedsYouNow — the star of the focused home.
 *
 * A single, premium, prioritized list of action items for the viewer's role.
 * Each row reads: what + why + (due) + a direct link to where it's actioned.
 * Pure presentation; the list is assembled server-side by `buildFocusItems`.
 */
import Link from "next/link";
import {
  AlertOctagon,
  TriangleAlert,
  Briefcase,
  Clock,
  Sparkles,
  ListChecks,
  Truck,
  ArrowRight,
  CheckCircle2,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateShort, isOverdue, daysUntilDate } from "@/lib/dates";
import type { FocusItem, FocusKind, FocusTone } from "@/lib/queries/home-focus";

const KIND_ICON: Record<FocusKind, React.ElementType> = {
  blocked_event: AlertOctagon,
  at_risk_event: TriangleAlert,
  quote: Briefcase,
  walkthrough: CalendarCheck,
  asset_review: Clock,
  studio_order: Sparkles,
  task: ListChecks,
  setup: Truck,
};

const TONE_ICON_WRAP: Record<FocusTone, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  info: "bg-info/10 text-info border-info/25",
  default: "bg-muted text-muted-foreground border-border",
};

export function NeedsYouNow({ items }: { items: FocusItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
        </span>
        <p className="text-base font-medium text-foreground">
          You&apos;re all caught up.
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Nothing is waiting on you right now. New work lands here the moment
          it&apos;s assigned.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id}>
          <FocusRow item={item} />
        </li>
      ))}
    </ul>
  );
}

function FocusRow({ item }: { item: FocusItem }) {
  const Icon = KIND_ICON[item.kind];
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 transition-colors",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border",
          TONE_ICON_WRAP[item.tone],
        )}
        aria-hidden
      >
        <Icon className="size-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {item.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.reason}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <DueChip dueDate={item.dueDate} />
        <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:inline-flex">
          {item.cta}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function DueChip({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const overdue = isOverdue(dueDate);
  const dueSoon = !overdue && daysUntilDate(dueDate) <= 3;
  return (
    <span
      className={cn(
        "hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap md:inline-flex",
        overdue
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : dueSoon
            ? "border-warning/30 bg-warning/10 text-warning"
            : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <CalendarClock className="size-2.5" aria-hidden />
      {overdue ? "Overdue" : formatDateShort(dueDate)}
    </span>
  );
}
