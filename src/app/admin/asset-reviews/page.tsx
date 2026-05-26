/**
 * Admin asset reviews — every asset uploaded by a customer that's
 * waiting for a Bright.Blue creative-team decision. Oldest first.
 */

import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetReviewQueue } from "@/components/admin/AssetReviewQueue";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getAssetsPendingReview } from "@/lib/queries/assets";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Asset reviews · Bright.Experience",
};

export default async function AssetReviewsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [pending, unread] = await Promise.all([
    getAssetsPendingReview(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Asset reviews"
      title="Creative review queue."
      subtitle={
        pending.length === 0
          ? "Queue empty. Nothing waiting for a creative decision."
          : `${pending.length} asset${pending.length === 1 ? "" : "s"} waiting for a decision. Oldest first.`
      }
      heroRight={
        pending.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {pending.length}
            </span>{" "}
            pending
          </div>
        ) : null
      }
    >
      {pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="When a customer uploads a new asset, it'll appear here for review against the spec."
          size="lg"
        />
      ) : (
        <div className="py-8">
          <AssetReviewQueue items={pending} />
        </div>
      )}
    </AdminPageShell>
  );
}
