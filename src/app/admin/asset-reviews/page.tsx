/**
 * Internal queue: every asset that's been uploaded and is waiting for a
 * Bright.Blue creative-team decision. Sorted oldest-first so the queue
 * naturally surfaces the assets that have been sitting longest.
 */
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetReviewQueue } from "@/components/admin/AssetReviewQueue";

import { CheckCircle2 } from "lucide-react";
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
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const [pending, unread] = await Promise.all([
    getAssetsPendingReview(),
    getUnreadCount(user.id),
  ]);

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Creative review"
        title="Asset reviews"
        subtitle={
          pending.length === 0
            ? "Queue empty. Nothing waiting for a creative decision."
            : `${pending.length} asset${pending.length === 1 ? "" : "s"} waiting for a Bright.Blue decision. Oldest first.`
        }
      />
      {pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="When a customer uploads a new asset, it'll appear here for review against the spec."
          size="lg"
        />
      ) : (
        <AssetReviewQueue items={pending} />
      )}
    </AppShell>
  );
}
