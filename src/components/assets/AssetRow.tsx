/** Single asset row for the asset list — shows status, metadata, upload CTA, and expandable comments. */
import {
  FileImage,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

import { AssetStatusBadge } from "@/components/ui/StatusBadge";
import { AssetUploadZone } from "@/components/assets/AssetUploadZone";
import { MachinePreview } from "@/components/assets/MachinePreview";
import { slotForAsset } from "@/lib/asset-requirements/machine-placements";
import { DEFAULT_MACHINE_SLUG, type MachineSlug } from "@/lib/asset-requirements/slot-registry";
import { AssetReviewBadge } from "@/components/assets/AssetReviewBadge";
import { AssetCommentSection } from "@/components/assets/AssetCommentSection";
import { AssetSpecCard } from "@/components/assets/AssetSpecCard";
import { AssetPreviewDialog } from "@/components/assets/AssetPreviewDialog";
import { formatDateShort, isOverdue as checkOverdue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { SURFACE_CARD } from "@/lib/surfaces";
import type { Asset, AssetAnnotation, Comment } from "@/types";

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

interface AssetRowProps {
  asset: Asset;
  comments?: Comment[];
  commentCount?: number;
  /** Region-anchored reviewer notes, shown read-only to the customer. */
  annotations?: AssetAnnotation[];
  currentUserId?: string;
  /** Whether the viewer is internal Bright.Blue staff. */
  isInternal?: boolean;
  /**
   * Whether the viewer may upload. Customers always can; among internal
   * staff only the creative team can (full creative control — upload on the
   * customer's behalf). Other internal roles see a read-only state.
   */
  canUpload?: boolean;
  /** Catalog machine variant driving the on-machine placement preview. */
  machineSlug?: MachineSlug;
}

export function AssetRow({ asset, comments = [], commentCount = 0, annotations = [], currentUserId, isInternal = false, canUpload = false, machineSlug = DEFAULT_MACHINE_SLUG }: AssetRowProps) {
  const openAnnotations = annotations.filter((a) => !a.resolved);
  const overdue =
    asset.status === "required" &&
    asset.dueDate &&
    checkOverdue(asset.dueDate);
  const needsAction =
    asset.status === "required" ||
    asset.reviewStatus === "revision_requested";

  return (
    <li className={cn(SURFACE_CARD, "relative overflow-hidden")}>
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 py-5 pl-5 pr-4">
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

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {asset.name}
            </h3>
            {(() => {
              // Single reconciled status pill — never show two competing states.
              // Terminal upload states win; otherwise surface the review stage.
              const uploaded = Boolean(asset.fileUrl);
              if (asset.status === "accepted" || asset.reviewStatus === "approved")
                return <AssetStatusBadge status="accepted" />;
              if (asset.status === "rejected")
                return <AssetStatusBadge status="rejected" />;
              if (uploaded && asset.reviewStatus === "revision_requested")
                return (
                  <AssetReviewBadge reviewStatus="revision_requested" hasUpload />
                );
              if (uploaded)
                return <AssetReviewBadge reviewStatus="pending_review" hasUpload />;
              return <AssetStatusBadge status={asset.status} />;
            })()}
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
              {asset.fileUrl ? (
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--color-bb-cobalt)] hover:underline"
                >
                  {asset.fileName}
                  <ExternalLink size={10} className="shrink-0" />
                </a>
              ) : (
                asset.fileName
              )}
              {asset.fileSize ? ` (${formatFileSize(asset.fileSize)})` : ""}
            </p>
          )}

          <AssetSpecCard asset={asset} />

          {(() => {
            const slot = slotForAsset(asset.name, machineSlug);
            if (!slot) return null;
            const fileName = asset.fileName ?? "";
            const isImageUpload =
              Boolean(asset.fileUrl) && /\.(png|jpe?g|webp|gif)$/i.test(fileName);
            const isVideoUpload =
              Boolean(asset.fileUrl) && /\.(mp4|webm|mov)$/i.test(fileName);
            const hasPreviewableUpload = isImageUpload || isVideoUpload;
            return (
              <div className="mt-3 max-w-[260px]">
                <MachinePreview
                  preview={slot.preview}
                  slot={slot}
                  overlaySrc={hasPreviewableUpload ? asset.fileUrl : null}
                  overlayKind={isVideoUpload ? "video" : "image"}
                />
              </div>
            );
          })()}

          {asset.uploadWarnings && asset.uploadWarnings.length > 0 && (
            <div className="mt-3 border-l-2 border-amber-400/60 pl-3 py-1">
              <p className="text-overline text-amber-400 mb-1">Upload warnings</p>
              <ul className="text-xs text-foreground/80 space-y-0.5">
                {asset.uploadWarnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            </div>
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

          {openAnnotations.length > 0 && (
            <div className="mt-3 border-l-2 border-[var(--color-bb-cobalt)]/60 pl-3 py-1">
              <p className="text-overline text-[var(--color-bb-cobalt)] mb-1.5">
                Marked-up notes from creative
              </p>
              <ul className="space-y-1.5">
                {openAnnotations.map((a, i) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/15 text-[10px] font-semibold text-[var(--color-bb-cobalt)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 break-words text-foreground/90 leading-snug">
                      {a.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {needsAction && canUpload ? (
            <AssetUploadZone
              asset={asset}
              machineSlug={machineSlug}
              asCreative={isInternal}
            />
          ) : asset.reviewStatus === "approved" && canUpload ? (
            <AssetUploadZone
              asset={asset}
              machineSlug={machineSlug}
              asCreative={isInternal}
            />
          ) : isInternal ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-overline text-muted-foreground">
              <Clock className="size-3" />
              {asset.reviewStatus === "revision_requested"
                ? "Waiting on customer to re-upload"
                : "Waiting on customer to upload"}
            </p>
          ) : null}
        </div>

        <div className="flex md:flex-col md:justify-end md:items-end gap-2">
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle size={13} /> {commentCount}
            </span>
          )}
          {asset.fileUrl && (
            <AssetPreviewDialog url={asset.fileUrl} fileName={asset.fileName ?? undefined} />
          )}
        </div>
      </div>
      {currentUserId && (
        <AssetCommentSection
          comments={comments}
          assetId={asset.id}
          eventId={asset.eventId}
          currentUserId={currentUserId}
          currentVersion={asset.version}
        />
      )}
    </li>
  );
}
