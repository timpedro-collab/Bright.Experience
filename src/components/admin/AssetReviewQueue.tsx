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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateShort, timeSince } from "@/lib/dates";
import { submitAssetReview } from "@/app/actions/asset-review";
import type { Asset } from "@/types";

type QueueAsset = Asset & {
  eventName: string | null;
  uploaderName: string | null;
};

interface AssetReviewQueueProps {
  items: QueueAsset[];
}

export function AssetReviewQueue({ items }: AssetReviewQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {items.map((asset) => (
        <AssetReviewRow
          key={asset.id}
          asset={asset}
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
  isExpanded,
  onToggle,
}: {
  asset: QueueAsset;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-amber-300/30 bg-amber-300/10 text-amber-200">
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {asset.name}
            </h3>
            <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
              Uploaded {timeSince(asset.reviewDecidedAt ?? "")}
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
        <div className="border-t border-white/[0.06] p-5 space-y-4">
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

          {asset.fileUrl && (
            <a
              href={asset.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Open uploaded file
            </a>
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
