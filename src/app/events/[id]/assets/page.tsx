/** Customer asset review — every asset the customer needs to upload or approve. */

import { notFound, redirect } from "next/navigation";
import { Upload } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetRow } from "@/components/assets/AssetRow";

import { getEventById } from "@/lib/queries/events";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getCommentCountsByAssets } from "@/lib/queries/comments";
import { getCommentsByEvent } from "@/lib/queries/comments";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, assets, unread, commentsByAsset] = await Promise.all([
    getEventById(id),
    getAssetsByEvent(id),
    getUnreadCount(user.id),
    getCommentsByEvent(id),
  ]);
  if (!event) return notFound();

  const assetIds = assets.map((a) => a.id);
  const commentCounts = await getCommentCountsByAssets(assetIds);

  const isInternal = isInternalRole(user.role);
  const accepted = assets.filter((a) => a.status === "accepted").length;
  const required = assets.filter((a) => a.status === "required").length;

  const subtitle =
    assets.length === 0
      ? "Asset requirements will appear here once your event reaches the creative stage."
      : required > 0
        ? `${required} asset${required === 1 ? "" : "s"} still need uploading. Drop them in below to keep your build on track.`
        : "All assets accepted. We'll let you know if anything else is needed.";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Assets"
      title="Your creative."
      subtitle={subtitle}
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        assets.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {accepted}
            </span>
            <span className="opacity-60"> / {assets.length} </span>
            accepted
          </div>
        ) : null
      }
    >
      {assets.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No assets required yet"
          description="Asset requirements will appear here once your event reaches the creative stage."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      ) : (
        <>
          <section className="py-6">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <EditorialEyebrow accent>Progress</EditorialEyebrow>
              <span className="text-overline text-muted-foreground tabular-nums">
                {accepted} of {assets.length} accepted · {required} still
                needed
              </span>
            </div>
            <ProgressBar value={accepted} max={assets.length} size="md" />
          </section>

          <Hairline className="opacity-60" />

          <section className="py-10">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <EditorialEyebrow>Every asset</EditorialEyebrow>
              <span className="text-overline text-muted-foreground tabular-nums">
                {assets.length} item{assets.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              {assets.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  comments={commentsByAsset[asset.id] ?? []}
                  commentCount={commentCounts[asset.id] ?? 0}
                  currentUserId={user.id}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </EventPageShell>
  );
}
