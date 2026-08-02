/**
 * RecentActivity — the "things that happened" half of the customer home
 * (Linear's Triage/Inbox split, docs/18-design-research.md R1). Deliberately
 * quiet: everything here already happened without the customer, so nothing
 * competes with "Over to you" above it. Uses the four-step text ramp so
 * title / body / timestamp sit at different volumes in one dense row.
 */
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";

import { GlassCard, GlassCardHeader } from "@/components/cloud";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { Notification } from "@/types";

interface RecentActivityProps {
  items: Notification[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) return null;

  return (
    <GlassCard>
      <GlassCardHeader
        title="Recent activity"
        description="What's happened while you were away — no action needed."
        action={
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            See all <ArrowRight size={12} />
          </Link>
        }
      />
      <ul className="px-3 pb-3">
        {items.map((item) => {
          const row = (
            <>
              <span
                aria-hidden
                className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/8 text-[var(--color-bb-cobalt)]"
              >
                <Activity size={12} />
              </span>
              <span className="min-w-0 flex-1 py-0.5">
                <span className="block truncate text-sm text-foreground/90 leading-snug">
                  {item.title}
                </span>
                {item.body && (
                  <span className="block truncate text-xs text-tertiary">
                    {item.body}
                  </span>
                )}
              </span>
              <span className="mt-1 shrink-0 text-xs text-quaternary tabular-nums">
                <TimeAgo dateStr={item.createdAt} />
              </span>
            </>
          );
          return (
            <li key={item.id}>
              {item.link ? (
                <Link
                  href={item.link}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-start gap-3 px-3 py-2">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
