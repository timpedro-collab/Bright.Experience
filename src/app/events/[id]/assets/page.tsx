/** Customer asset review — every asset the customer needs to upload or approve. */

import { notFound, redirect } from "next/navigation";
import { Upload } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetRow } from "@/components/assets/AssetRow";
import { BrandKitCard } from "@/components/briefing/BrandKitCard";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getEventById } from "@/lib/queries/events";
import { getBrandKit } from "@/app/actions/briefing";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getCommentCountsByAssets } from "@/lib/queries/comments";
import { getCommentsByEvent } from "@/lib/queries/comments";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getMachineSlugsByEvent } from "@/lib/queries/machine-instances";
import { getUser } from "@/lib/auth";
import { isInternalRole, canReviewCreativeAssets } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { resolveMachineSlugForEvent } from "@/lib/asset-requirements/machine-placements";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "assets")) redirect(`/events/${id}`);
  const [event, assets, unread, commentsByAsset, instanceSlugs, brandKit] = await Promise.all([
    getEventById(id),
    getAssetsByEvent(id),
    getUnreadCount(user.id),
    getCommentsByEvent(id),
    getMachineSlugsByEvent(id),
    getBrandKit(id),
  ]);
  if (!event) return notFound();

  const machineSlug = resolveMachineSlugForEvent(event, {
    instanceMachineSlugs: instanceSlugs,
  });
  const assetIds = assets.map((a) => a.id);
  const commentCounts = await getCommentCountsByAssets(assetIds);

  const isInternal = isInternalRole(user.role);
  // The creative team has full control: they can upload creative on the
  // customer's behalf (e.g. assets emailed over) even before the customer
  // provides them. Customers upload their own; other internal roles
  // (Events Lead oversight) see a read-only "waiting on customer" state.
  const canUpload = !isInternal || canReviewCreativeAssets(user.role);
  const accountName = event.account.name;
  const accepted = assets.filter((a) => a.status === "accepted").length;
  const required = assets.filter((a) => a.status === "required").length;

  const subtitle =
    assets.length === 0
      ? isInternal
        ? "Asset requirements appear here once the event reaches the creative stage."
        : "Asset requirements will appear here once your event reaches the creative stage."
      : required > 0
        ? isInternal
          ? `${required} asset${required === 1 ? "" : "s"} still outstanding from ${accountName}.`
          : `${required} asset${required === 1 ? "" : "s"} still need uploading. Drop them in below to keep your build on track.`
        : isInternal
          ? `All assets accepted — nothing outstanding from ${accountName}.`
          : "All assets accepted. We'll let you know if anything else is needed.";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Assets"
      title={isInternal ? "Customer assets." : "Your creative."}
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
      <section className="py-8">
        <div className="mb-4">
          <EditorialEyebrow accent>Brand kit</EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
            {isInternal
              ? `Colours, fonts, and usage rules ${accountName} has shared — no PDF digging required.`
              : "Share your colours and fonts here so we stay perfectly on-brand. Quicker than hunting down a guidelines PDF."}
          </p>
        </div>
        <BrandKitCard eventId={id} kit={brandKit} canEdit={!isInternal} />
      </section>

      <Hairline className="opacity-60" />

      {assets.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No assets required yet"
          description={
            isInternal
              ? "Asset requirements appear here once the event reaches the creative stage."
              : "Asset requirements will appear here once your event reaches the creative stage."
          }
          action={
            isInternal
              ? { label: "View timeline", href: `/events/${id}/timeline` }
              : { label: "Back to overview", href: `/events/${id}` }
          }
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
                  isInternal={isInternal}
                  canUpload={canUpload}
                  machineSlug={machineSlug}
                />
              ))}
            </ul>
          </section>
        </>
      )}
      <AutoRefresh />
    </EventPageShell>
  );
}
