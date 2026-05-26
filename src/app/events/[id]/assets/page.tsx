/**
 * Customer asset review — every asset the customer needs to upload or
 * approve for this event, rebuilt in the editorial Bright.Experience
 * design language (EditionShell + RidgeHero + hairline-separated rows).
 */

import { notFound, redirect } from "next/navigation";
import {
  Upload,
  FileImage,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { EventPageShell } from "@/components/brand";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { AssetStatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetUploadButton } from "@/components/assets/AssetUploadButton";
import { AssetReviewBadge } from "@/components/assets/AssetReviewBadge";

import { getEventById } from "@/lib/queries/events";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { formatDateShort, isOverdue as checkOverdue } from "@/lib/dates";
import type { Asset } from "@/types";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAssetIcon(assetType: string, size = 18) {
  switch (assetType) {
    case "logo":
    case "imagery":
      return <FileImage size={size} />;
    default:
      return <FileText size={size} />;
  }
}

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, assets, unread] = await Promise.all([
    getEventById(id),
    getAssetsByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

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
          {/* Progress strip */}
          <section className="py-6">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <EditorialEyebrow accent>Progress</EditorialEyebrow>
              <span className="text-overline text-muted-foreground tabular-nums">
                {accepted} of {assets.length} accepted · {required} still needed
              </span>
            </div>
            <ProgressBar value={accepted} max={assets.length} size="md" />
          </section>

          <Hairline className="opacity-60" />

          {/* Asset list */}
          <section className="py-10">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <EditorialEyebrow>Every asset</EditorialEyebrow>
              <span className="text-overline text-muted-foreground tabular-nums">
                {assets.length} item{assets.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
              {assets.map((asset) => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </ul>
          </section>
        </>
      )}
    </EventPageShell>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const overdue =
    asset.status === "required" &&
    asset.dueDate &&
    checkOverdue(asset.dueDate);
  const needsAction =
    asset.status === "required" ||
    asset.reviewStatus === "revision_requested";

  return (
    <li className="relative">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 py-5 pl-3 pr-2">
        {/* Left accent stripe */}
        <span
          aria-hidden
          className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-full ${
            overdue
              ? "bg-destructive"
              : needsAction
                ? "bg-[var(--color-bb-cobalt)]"
                : asset.status === "accepted"
                  ? "bg-success/50"
                  : "bg-transparent"
          }`}
        />

        {/* Glyph */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
            asset.status === "accepted"
              ? "border-success/30 bg-success/10 text-success"
              : asset.status === "rejected"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border/60 bg-card/40 text-muted-foreground"
          }`}
        >
          {asset.status === "accepted" ? (
            <CheckCircle2 size={18} />
          ) : asset.status === "rejected" ? (
            <XCircle size={18} />
          ) : (
            renderAssetIcon(asset.assetType)
          )}
        </div>

        {/* Body */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {asset.name}
            </h3>
            <AssetReviewBadge
              reviewStatus={asset.reviewStatus}
              hasUpload={Boolean(asset.fileUrl)}
            />
            <AssetStatusBadge status={asset.status} />
          </div>

          {asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {asset.description}
            </p>
          )}

          <p className="mt-1.5 text-overline text-muted-foreground">
            {asset.requiredFormat && <>Format · {asset.requiredFormat}</>}
            {asset.requiredFormat && asset.requiredDimensions && (
              <span className="opacity-60"> · </span>
            )}
            {asset.requiredDimensions && (
              <>Size · {asset.requiredDimensions}</>
            )}
            {asset.dueDate && (
              <>
                <span className="opacity-60"> · </span>
                <span
                  className={
                    overdue ? "text-destructive" : "text-muted-foreground"
                  }
                >
                  {overdue ? (
                    <AlertCircle className="inline size-3 -mt-0.5 mr-0.5" />
                  ) : (
                    <Clock className="inline size-3 -mt-0.5 mr-0.5" />
                  )}
                  {overdue ? "Overdue " : "Due "}
                  {formatDateShort(asset.dueDate)}
                </span>
              </>
            )}
          </p>

          {asset.fileName && (
            <p className="mt-1 text-xs text-muted-foreground truncate opacity-80">
              {asset.fileName}
              {asset.fileSize ? ` (${formatFileSize(asset.fileSize)})` : ""}
            </p>
          )}

          {asset.reviewFeedback &&
            asset.reviewStatus === "revision_requested" && (
              <div className="mt-3 border-l-2 border-warning/60 pl-3 py-1">
                <p className="text-overline text-warning mb-1">
                  Note from creative
                </p>
                <p className="text-sm text-foreground/90 whitespace-pre-line leading-snug">
                  {asset.reviewFeedback}
                </p>
              </div>
            )}
        </div>

        {/* Action */}
        <div className="flex md:justify-end md:items-start">
          {needsAction && (
            <AssetUploadButton assetId={asset.id} eventId={asset.eventId} />
          )}
        </div>
      </div>
    </li>
  );
}
