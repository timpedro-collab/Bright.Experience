/**
 * Pill indicating where an uploaded asset sits in the Bright.Blue creative
 * review flow. Distinct from the customer's upload status (`required` ->
 * `uploaded` -> ...): this badge surfaces the reviewer's decision so the
 * customer always knows whose plate the asset is on.
 */
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AssetReviewStatus } from "@/types";

interface AssetReviewBadgeProps {
  reviewStatus: AssetReviewStatus;
  /** When true, an asset is uploaded — otherwise we render nothing. */
  hasUpload: boolean;
}

const STYLES: Record<
  AssetReviewStatus,
  { label: string; classes: string; Icon: typeof CheckCircle2 }
> = {
  pending_review: {
    label: "Pending Bright.Blue review",
    classes: "border-warning/30 bg-warning/15 text-warning",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    classes: "border-success/30 bg-success/10 text-success",
    Icon: CheckCircle2,
  },
  revision_requested: {
    label: "Revision requested",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
    Icon: AlertCircle,
  },
};

export function AssetReviewBadge({
  reviewStatus,
  hasUpload,
}: AssetReviewBadgeProps) {
  if (!hasUpload) return null;
  const { label, classes, Icon } = STYLES[reviewStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium leading-none whitespace-nowrap",
        classes
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
