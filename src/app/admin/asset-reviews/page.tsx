/**
 * Admin asset reviews — every asset uploaded by a customer that's
 * waiting for a Bright.Blue creative-team decision. Oldest first.
 */

import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetReviewQueue } from "@/components/admin/AssetReviewQueue";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getUser } from "@/lib/auth";
import { canViewCreativeQueue, canReviewCreativeAssets } from "@/lib/roles";
import { getAssetsPendingReviewPaginated } from "@/lib/queries/assets";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

export const metadata = {
  title: "Asset reviews · Bright.Experience",
};

interface AssetReviewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AssetReviewsPage({
  searchParams,
}: AssetReviewsPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  // Creative-only surface. Events Lead gets read-only oversight; Ops/QA
  // and customers are bounced.
  if (!canViewCreativeQueue(user.role)) redirect("/");
  const canReview = canReviewCreativeAssets(user.role);

  const params = await searchParams;
  const page = parsePage(params as Record<string, string | string[] | undefined>);

  const [{ data: pending, totalCount, totalPages }, unread] = await Promise.all([
    getAssetsPendingReviewPaginated(page),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Asset reviews"
      title="Creative review queue."
      subtitle={
        totalCount === 0
          ? "Queue empty. Nothing waiting for a creative decision."
          : canReview
            ? `${totalCount} asset${totalCount === 1 ? "" : "s"} waiting for a decision. Oldest first.`
            : `${totalCount} asset${totalCount === 1 ? "" : "s"} with the Creative team for sign-off. Oversight view — read only.`
      }
      heroRight={
        totalCount > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {totalCount}
            </span>{" "}
            pending
          </div>
        ) : null
      }
    >
      <AutoRefresh />
      {totalCount === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="When a customer uploads a new asset, it'll appear here for review against the spec."
          size="lg"
        />
      ) : (
        <div className="py-8">
          <AssetReviewQueue items={pending} canReview={canReview} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/admin/asset-reviews"
          />
        </div>
      )}
    </AdminPageShell>
  );
}
