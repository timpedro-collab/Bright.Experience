/**
 * AE backstop queue — every customer-side action item that has sat
 * stale for 7+ days. Surfaces the people the system has emailed twice
 * and is now ready to escalate by phone.
 *
 * Pulls from three sources:
 *   - Pending Bright.Blue creative approvals waiting on the customer
 *   - Brief responses that are unsubmitted
 *   - Asset revisions the customer hasn't re-uploaded
 *
 * Listed oldest-first so the AE can pick up the riskiest item first.
 */

import { redirect } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimeAgo } from "@/components/ui/TimeAgo";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getStuckCustomerQueueItems,
  STUCK_CUSTOMER_DAYS,
} from "@/lib/queries/admin-queues";

export const metadata = {
  title: "Customer queue · Bright.Experience",
};

const STALE_DAYS = STUCK_CUSTOMER_DAYS;

function ageDays(iso: string): number {
  if (!iso) return 0;
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)
  );
}

export default async function CustomerQueuePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [items, unread] = await Promise.all([
    getStuckCustomerQueueItems(STALE_DAYS),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Customer queue"
      eyebrow="Internal · Account managers"
      title="Time to pick up the phone."
      subtitle={
        items.length === 0
          ? "Nothing has gone stale. Every customer-side item is inside the reminder window."
          : `${items.length} item${items.length === 1 ? "" : "s"} sitting > ${STALE_DAYS} days. Time to pick up the phone — the reminders have already gone out.`
      }
      heroRight={
        items.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {items.length}
            </span>{" "}
            stale
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Queue empty"
          description="When a customer-side action sits longer than 7 days, it'll appear here so you can chase by phone."
          size="lg"
        />
      ) : (
        <div className="py-8">
          <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <a
                  href={item.link}
                  className="group flex items-center gap-4 py-4 pl-3 pr-2 transition-colors hover:bg-accent/30"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-warning/60"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-overline text-muted-foreground truncate">
                      {item.accountName ? `${item.accountName} · ` : ""}
                      {item.eventName ?? "Account-level"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-warning font-semibold tabular-nums">
                      {ageDays(item.anchor)} days
                    </p>
                    <p className="text-overline text-muted-foreground">
                      Since <TimeAgo dateStr={item.anchor} />
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminPageShell>
  );
}
