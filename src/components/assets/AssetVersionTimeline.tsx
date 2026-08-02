/** Vertical version history for an asset — newest first, with review outcome. */
"use client";

import * as React from "react";
import { CheckCircle2, Clock, RotateCcw, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { AssetVersion } from "@/types";

const STATUS_META: Record<
  AssetVersion["reviewStatus"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-emerald-500",
  },
  revision_requested: {
    label: "Revision requested",
    icon: RotateCcw,
    className: "text-amber-500",
  },
  pending_review: {
    label: "Pending review",
    icon: Clock,
    className: "text-muted-foreground",
  },
};

export function AssetVersionTimeline({
  versions,
  className,
}: {
  versions: AssetVersion[];
  className?: string;
}) {
  if (versions.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        No version history yet — the first upload starts the timeline.
      </p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {versions.map((v, idx) => {
        const meta = STATUS_META[v.reviewStatus];
        const Icon = meta.icon;
        const isLatest = idx === 0;
        return (
          <li key={v.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  isLatest
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              {idx < versions.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  v{v.version}
                </span>
                {isLatest && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Current
                  </span>
                )}
                <span className={cn("text-xs font-medium", meta.className)}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v.uploaderName ? `${v.uploaderName} · ` : ""}
                {v.createdAt ? (
                  <>
                    uploaded <TimeAgo dateStr={v.createdAt} />
                  </>
                ) : (
                  ""
                )}
                {v.reviewDecidedAt
                  ? ` · decided ${formatDateShort(v.reviewDecidedAt)}`
                  : ""}
              </p>
              {v.reviewFeedback && (
                <p className="mt-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground/80">
                  {v.reviewFeedback}
                </p>
              )}
              {v.fileUrl && (
                <a
                  href={v.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  {v.fileName ?? "Open file"}
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
