/**
 * "Right now, here's where things sit" — a single panel that surfaces
 * every party currently owing work on an event, with the customer's row
 * highlighted when they're the viewer.
 *
 * The panel sits directly under the next-step hero on the event overview
 * so the customer (or internal user) reads the room at a glance without
 * having to scan the full task list.
 */
import { ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { groupOpenTasksByOwner, resolveOwnerBadge } from "@/lib/ownership";
import type { Task, UserRole } from "@/types";

const CUSTOMER_ROLES: UserRole[] = ["customer_user", "customer_admin"];

interface EventOwnershipPanelProps {
  tasks: Task[];
  viewerRole: UserRole;
  /** Where rows link to — typically `/events/{id}/actions`. */
  ctaHref: string;
}

export function EventOwnershipPanel({
  tasks,
  viewerRole,
  ctaHref,
}: EventOwnershipPanelProps) {
  const buckets = groupOpenTasksByOwner(tasks);
  const isInternal = !CUSTOMER_ROLES.includes(viewerRole);

  if (buckets.length === 0) {
    return (
      <Card tone="subtle">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-foreground font-medium">
            Everyone&apos;s caught up.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            There&apos;s no open work waiting on anyone right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card tone="subtle">
      <CardHeader className="pb-3">
        <CardTitle>Right now, here&apos;s where things sit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {buckets.map(({ owner, tasks: ownerTasks }) => {
            const { label: heading, isYou } = resolveOwnerBadge(
              owner,
              viewerRole,
              isInternal
            );
            return (
              <a
                key={owner}
                href={ctaHref}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-[var(--radius-control)] border p-3",
                  "transition-all hover:border-border",
                  isYou
                    ? "border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/[0.06] hover:bg-[var(--color-bb-cobalt)]/[0.1]"
                    : "border-border/60 bg-muted/40 hover:bg-accent"
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider font-semibold",
                      isYou ? "text-[var(--color-bb-cobalt)]" : "text-muted-foreground"
                    )}
                  >
                    {heading}
                  </p>
                  <p className="mt-1 text-sm text-foreground truncate">
                    {ownerTasks[0].title}
                    {ownerTasks.length > 1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        + {ownerTasks.length - 1} more
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
