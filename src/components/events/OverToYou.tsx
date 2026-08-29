/**
 * "Over to you" — the single, fused action block on every customer surface.
 *
 * Answers "what's on me?" once. It merges what used to be three competing
 * widgets (the big next-step CTA, the "Needs you" KPI, and the action list)
 * into one honest block: the most important task is the loud primary row with
 * the cobalt CTA, the rest are quiet supporting rows, and every item carries a
 * plain "why it matters" line. When nothing is outstanding it becomes a calm,
 * forward-looking "all clear" state that previews what's coming next — so a
 * quiet moment never reads as "finished forever".
 *
 * Pure presentation: the caller fetches the action items + next step.
 */
import Link from "next/link";
import {
  ArrowRight,
  Upload,
  FileText,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarDays,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import { GlassCard, GlassCardHeader } from "@/components/cloud";
import { actionWhyLine, groupAssetActions } from "@/lib/customer-action-copy";
import type { CustomerActionItem } from "@/lib/queries/deadlines";
import type { NextStep } from "@/lib/event-next-step";

interface OverToYouProps {
  eventId: string;
  items: CustomerActionItem[];
  /** Resolved single next step — supplies the primary CTA + all-clear copy. */
  nextStep: NextStep | null;
  /** The customer's next upcoming milestone, for the forward-looking preview. */
  nextUp?: { label: string; targetDate?: string } | null;
}

function EntityIcon({
  type,
  className,
}: {
  type: CustomerActionItem["entityType"];
  className?: string;
}) {
  const props = { size: 15, className: cn("shrink-0", className) };
  switch (type) {
    case "asset":
      return <Upload {...props} />;
    case "briefing":
      return <FileText {...props} />;
    case "task":
    default:
      return <ListChecks {...props} />;
  }
}

/** Fallback CTA label when the resolved next step targets a different item. */
function ctaLabelForItem(item: CustomerActionItem): string {
  switch (item.entityType) {
    case "asset":
      return "Upload assets";
    case "briefing":
      return "Complete the briefing";
    case "task":
    default:
      return "Start now";
  }
}

/** Canonical destination for an action item. */
function linkForItem(eventId: string, item: CustomerActionItem): string {
  switch (item.entityType) {
    case "asset":
      return `/events/${eventId}/assets`;
    case "briefing":
      return `/events/${eventId}/briefing`;
    case "task":
    default:
      return `/events/${eventId}/${item.targetPath ?? "actions"}`;
  }
}

function DueBadge({ item }: { item: CustomerActionItem }) {
  if (!item.dueDate) return null;
  const overdue = item.urgency === "overdue";
  const soon = item.urgency === "due_soon";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs tabular-nums",
        overdue
          ? "text-destructive"
          : soon
            ? "text-warning"
            : "text-muted-foreground",
      )}
    >
      {overdue && <AlertTriangle size={11} />}
      {soon && <Clock size={11} />}
      {overdue ? "Overdue · " : "Due "}
      {formatDateShort(item.dueDate)}
    </span>
  );
}

export function OverToYou({
  eventId,
  items: rawItems,
  nextStep,
  nextUp = null,
}: OverToYouProps) {
  // Collapse repetitive per-file upload rows into one "N brand assets" row so
  // the primary CTA, supporting rows, and "N things" count all agree.
  const items = groupAssetActions(rawItems);
  const count = items.length;

  // All-clear state (#7): calm reassurance + a forward-looking "next up".
  if (count === 0) {
    return (
      <GlassCard data-tour="waiting-on-you">
        <GlassCardHeader
          title="Over to you"
          description="Nothing needs you right now."
        />
        <div className="p-6">
          <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/5 p-5">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {nextStep?.description ??
                  "We're getting on with the work behind the scenes. We'll let you know the moment something needs you."}
              </p>
              {nextUp && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                  <CalendarDays size={13} className="text-[var(--color-bb-cobalt)]" />
                  Next up: {nextUp.label}
                  {nextUp.targetDate
                    ? ` · around ${formatDateShort(nextUp.targetDate)}`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const [first, ...rest] = items;
  // The button belongs to the promoted row. Borrow the resolved next-step CTA
  // only when it points at the same destination — otherwise the pill would
  // advertise a different action than the task it sits under (e.g. "Upload
  // assets" beneath "Provide onsite contact details").
  const primaryHref = linkForItem(eventId, first);
  const primaryLabel =
    nextStep && nextStep.primaryAction.href === primaryHref
      ? nextStep.primaryAction.label
      : ctaLabelForItem(first);

  return (
    <GlassCard data-tour="waiting-on-you">
      <GlassCardHeader
        title="Over to you"
        description="Complete these to keep your activation on track."
        action={
          <span className="text-overline text-muted-foreground tabular-nums">
            {count} thing{count === 1 ? "" : "s"}
          </span>
        }
      />
      <div className="p-6 space-y-4">
        {/* Primary row — the one thing that matters most, loud. */}
        <div className="rounded-2xl border border-[var(--color-bb-cobalt)]/30 bg-[var(--color-bb-cobalt)]/[0.04] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <EntityIcon
                  type={first.entityType}
                  className="text-[var(--color-bb-cobalt)]"
                />
                <span className="text-base font-semibold text-foreground leading-snug">
                  {first.title}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {actionWhyLine(first)}
              </p>
            </div>
            <DueBadge item={first} />
          </div>
          <Link
            href={primaryHref}
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {primaryLabel}
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Supporting rows — quieter, each with its own why-line. */}
        {rest.length > 0 && (
          <ul className="space-y-1">
            {rest.map((item) => (
              <li key={item.id}>
                <Link
                  href={linkForItem(eventId, item)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                >
                  <EntityIcon
                    type={item.entityType}
                    className="text-[var(--color-bb-cobalt)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground leading-snug">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {actionWhyLine(item)}
                    </span>
                  </span>
                  <DueBadge item={item} />
                  <ArrowRight
                    size={13}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/events/${eventId}/actions`}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          See all {count} {count === 1 ? "task" : "tasks"}
          <ArrowRight size={12} />
        </Link>
      </div>
    </GlassCard>
  );
}
