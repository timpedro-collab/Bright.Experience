"use client";

/**
 * Asset review queue — the operational surface for Bright.Blue creative
 * leads. Each row expands into a preview + decision pane:
 *
 *   - Approve → flips review_status to `approved` and dispatches the
 *     customer-facing `asset.review_approved` archetype.
 *   - Request a revision → captures a feedback note, dispatches
 *     `asset.revision_requested` with the note inline.
 *
 * The component is intentionally pragmatic — modest accordion, no fancy
 * full-screen modal. Reviewers care about throughput, not chrome.
 */

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { submitAssetReview } from "@/app/actions/asset-review";
import { requestStudioFixForAsset } from "@/app/actions/studio";
import { loadAssetReviewDetail } from "@/app/actions/asset-detail";
import { MachinePreview } from "@/components/assets/MachinePreview";
import { AssetVersionTimeline } from "@/components/assets/AssetVersionTimeline";
import { VersionCompareDialog } from "@/components/assets/VersionCompareDialog";
import { AnnotatablePreview } from "@/components/assets/AnnotatablePreview";
import { slotForAsset } from "@/lib/asset-requirements/machine-placements";
import type { Asset, AssetAnnotation, AssetVersion } from "@/types";

type QueueAsset = Asset & {
  eventName: string | null;
  uploaderName: string | null;
};

interface AssetReviewQueueProps {
  items: QueueAsset[];
  /**
   * Whether the viewer may action sign-off. Creative team + admin → true.
   * Events Lead (oversight) → false: they see the queue read-only.
   */
  canReview?: boolean;
}

export function AssetReviewQueue({ items, canReview = true }: AssetReviewQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {items.map((asset) => (
        <AssetReviewRow
          key={asset.id}
          asset={asset}
          canReview={canReview}
          isExpanded={expandedId === asset.id}
          onToggle={() =>
            setExpandedId((current) => (current === asset.id ? null : asset.id))
          }
        />
      ))}
    </div>
  );
}

function AssetReviewRow({
  asset,
  canReview,
  isExpanded,
  onToggle,
}: {
  asset: QueueAsset;
  canReview: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  const [studioPending, startStudioTransition] = useTransition();
  const [versions, setVersions] = useState<AssetVersion[] | null>(null);
  const [annotations, setAnnotations] = useState<AssetAnnotation[]>([]);
  const router = useRouter();

  const slot = slotForAsset(asset.name);
  const machine = slot?.preview ?? null;
  const fileName = asset.fileName ?? "";
  const isVideoUpload = /\.(mp4|webm|mov)$/i.test(fileName);
  const isImageUpload = /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const canPreview = Boolean(asset.fileUrl) && machine && (isImageUpload || isVideoUpload);

  // Lazy-load version history + annotations the first time a row is opened.
  useEffect(() => {
    if (!isExpanded || versions !== null) return;
    let active = true;
    loadAssetReviewDetail(asset.id).then((detail) => {
      if (!active) return;
      setVersions(detail.versions);
      setAnnotations(detail.annotations);
    });
    return () => {
      active = false;
    };
  }, [isExpanded, versions, asset.id]);

  function handleStudioHandoff() {
    startStudioTransition(async () => {
      const result = await requestStudioFixForAsset(asset.id);
      if (!result.success) {
        toast.error(result.error ?? "Could not raise the Studio order.");
        return;
      }
      toast.success("Bright.Studio order raised from this asset.");
      router.refresh();
    });
  }

  function handleDecision(decision: "approved" | "revision_requested") {
    startTransition(async () => {
      const result = await submitAssetReview({
        assetId: asset.id,
        decision,
        feedback: decision === "revision_requested" ? feedback.trim() : undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not save the review.");
        return;
      }
      toast.success(
        decision === "approved"
          ? "Approved. The customer will be notified."
          : "Revision sent back with your note."
      );
      setFeedback("");
      router.refresh();
    });
  }

  return (
    <Card tone="subtle" className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-accent transition-colors"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-warning/30 bg-warning/15 text-warning">
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {asset.name}
            </h3>
            <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
              Uploaded <TimeAgo dateStr={asset.updatedAt ?? asset.reviewDecidedAt ?? ""} />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {asset.eventName ? `${asset.eventName} · ` : ""}
            {asset.uploaderName ? `from ${asset.uploaderName}` : "Customer upload"}
            {asset.revisionCount > 0
              ? ` · revision ${asset.revisionCount + 1}`
              : ""}
          </p>
        </div>
        <span
          className={cn(
            "text-xs text-muted-foreground transition-transform shrink-0",
            isExpanded && "rotate-180"
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-border/60 p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
            {/* Left: the same on-machine preview the customer sees */}
            <div className="space-y-3">
              {canPreview ? (
                <MachinePreview
                  preview={machine!}
                  slot={slot ?? undefined}
                  overlaySrc={asset.fileUrl}
                  overlayKind={isVideoUpload ? "video" : "image"}
                />
              ) : asset.fileUrl ? (
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Open uploaded file
                  </span>
                </a>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  No file uploaded yet
                </div>
              )}
              {asset.fileUrl && canPreview && (
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Open original file
                </a>
              )}

              <div>
                <p className="text-overline text-muted-foreground mb-2">
                  Version history
                </p>
                {versions === null ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  <div className="space-y-3">
                    <AssetVersionTimeline versions={versions} />
                    <VersionCompareDialog
                      versions={versions}
                      assetName={asset.name}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right: spec checklist + decision */}
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <Detail label="Type" value={asset.assetType} />
                <Detail
                  label="Required format"
                  value={asset.requiredFormat ?? "—"}
                />
                <Detail
                  label="Required size"
                  value={asset.requiredDimensions ?? "—"}
                />
                <Detail
                  label="Due date"
                  value={asset.dueDate ? formatDateShort(asset.dueDate) : "—"}
                />
              </div>

              {asset.uploadWarnings && asset.uploadWarnings.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/15 p-3">
                  <p className="flex items-center gap-1.5 text-overline text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> Spec flags from upload
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-warning/90">
                    {asset.uploadWarnings.map((w, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span aria-hidden>•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!canReview ? (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
                  <p className="text-overline text-muted-foreground mb-1">
                    Oversight view
                  </p>
                  Sign-off on creative assets is handled by the Creative team.
                  You can track status and history here, but approvals and
                  revision requests are theirs to make.
                </div>
              ) : (
                <>
              {isImageUpload && asset.fileUrl && (
                <div>
                  <p className="text-overline text-muted-foreground mb-2">
                    Mark up the creative
                  </p>
                  <AnnotatablePreview
                    assetId={asset.id}
                    eventId={asset.eventId}
                    imageUrl={asset.fileUrl}
                    initialAnnotations={annotations}
                  />
                </div>
              )}

              <div>
                <label className="text-overline text-muted-foreground block mb-2">
                  Feedback (required for revisions)
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Be specific: dimensions, colour profile, copy fix, etc. This goes straight to the customer."
                  rows={3}
                  disabled={pending}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="default"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleDecision("approved")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || feedback.trim().length === 0}
                  onClick={() => handleDecision("revision_requested")}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Request a revision
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={studioPending}
                  onClick={handleStudioHandoff}
                  className="text-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  Hand to Bright.Studio
                </Button>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-overline text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5 break-words">{value}</p>
    </div>
  );
}
