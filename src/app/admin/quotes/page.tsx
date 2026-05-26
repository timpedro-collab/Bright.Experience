/** Internal quote queue dashboard — all quotes with filter/sort. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { QuoteQueueTable } from "@/components/quotes/QuoteQueueTable";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getQuotes } from "@/lib/queries/quotes";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function QuotesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [quotes, unread] = await Promise.all([
    getQuotes(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Quote queue"
      title="The quote queue."
      subtitle="Every Book Now and proposal request — assign, work, and ship."
      heroRight={
        quotes.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {quotes.length}
            </span>{" "}
            in flight
          </div>
        ) : null
      }
    >
      <div className="py-8">
        <QuoteQueueTable
          quotes={quotes as Parameters<typeof QuoteQueueTable>[0]["quotes"]}
        />
      </div>
    </AdminPageShell>
  );
}
