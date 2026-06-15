/** "What's needed from you" — single view of everything the customer owes. */
import Link from "next/link";
import {
  Upload,
  FileText,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import type { CustomerActionItem } from "@/lib/queries/deadlines";

interface CustomerActionSummaryProps {
  eventId: string;
  items: CustomerActionItem[];
}

function EntityIcon({ type }: { type: CustomerActionItem["entityType"] }) {
  switch (type) {
    case "task":
      return <ListChecks size={14} className="text-[var(--color-bb-cobalt)]" />;
    case "asset":
      return <Upload size={14} className="text-[var(--color-bb-cobalt)]" />;
    case "briefing":
      return <FileText size={14} className="text-[var(--color-bb-cobalt)]" />;
  }
}

function linkForItem(eventId: string, item: CustomerActionItem): string {
  switch (item.entityType) {
    case "task":
      return `/events/${eventId}/${item.targetPath ?? "actions"}`;
    case "asset":
      return `/events/${eventId}/assets`;
    case "briefing":
      return `/events/${eventId}/briefing`;
  }
}

export function CustomerActionSummary({ eventId, items }: CustomerActionSummaryProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 rounded-xl bg-success/5 border border-success/20">
        <CheckCircle2 size={20} className="text-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Nothing needed from you right now
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We&apos;ll let you know when something needs your attention.
          </p>
        </div>
      </div>
    );
  }

  const overdueCount = items.filter((i) => i.urgency === "overdue").length;

  return (
    <div className="space-y-3">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertTriangle size={14} />
          {overdueCount} overdue item{overdueCount === 1 ? "" : "s"} — please action as
          soon as possible
        </div>
      )}

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={linkForItem(eventId, item)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <EntityIcon type={item.entityType} />
              <span className="text-sm text-foreground truncate flex-1">
                {item.title}
              </span>
              {item.dueDate && (
                <span
                  className={cn(
                    "text-xs shrink-0",
                    item.urgency === "overdue"
                      ? "text-destructive"
                      : item.urgency === "due_soon"
                        ? "text-amber-400"
                        : "text-muted-foreground"
                  )}
                >
                  {item.urgency === "overdue" && (
                    <AlertTriangle size={10} className="inline mr-0.5 -mt-0.5" />
                  )}
                  {item.urgency === "due_soon" && (
                    <Clock size={10} className="inline mr-0.5 -mt-0.5" />
                  )}
                  {formatDateShort(item.dueDate)}
                </span>
              )}
              <ArrowRight
                size={12}
                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
