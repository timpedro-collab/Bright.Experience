/** Internal quote queue dashboard — all quotes with filter/sort. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { QuoteQueueTable } from "@/components/quotes/QuoteQueueTable";
import { Pagination } from "@/components/ui/Pagination";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getQuotesPaginated } from "@/lib/queries/quotes";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";

interface QuotesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Quote queue",
};

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const params = await searchParams;
  const page = parsePage(params);

  const [result, unread] = await Promise.all([
    getQuotesPaginated(page),
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
        result.totalCount > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {result.totalCount}
            </span>{" "}
            in flight
          </div>
        ) : null
      }
    >
      <div className="py-8">
        <QuoteQueueTable
          quotes={result.data as Parameters<typeof QuoteQueueTable>[0]["quotes"]}
        />
        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          basePath="/admin/quotes"
        />
      </div>
    </AdminPageShell>
  );
}
