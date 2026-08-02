/**
 * VersionCompareDialog — picks the two most recent image versions of an
 * asset and opens them in the VersionCompareSlider. Renders nothing unless
 * there are at least two comparable image versions, so callers can include
 * it unconditionally.
 */
"use client";

import * as React from "react";
import { Columns2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VersionCompareSlider } from "@/components/assets/VersionCompareSlider";
import type { AssetVersion } from "@/types";

function isImage(v: AssetVersion): boolean {
  const target = (v.fileName ?? v.fileUrl ?? "").toLowerCase().split("?")[0];
  return /\.(png|jpe?g|webp|gif|avif)$/.test(target) && Boolean(v.fileUrl);
}

export function VersionCompareDialog({
  versions,
  assetName,
}: {
  /** Version history, newest first (the order AssetVersionTimeline uses). */
  versions: AssetVersion[];
  assetName?: string;
}) {
  const comparable = versions.filter(isImage);
  if (comparable.length < 2) return null;

  const [newest, previous] = comparable;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns2 size={14} />
          Compare v{previous.version} → v{newest.version}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {assetName ? `${assetName} — ` : ""}what changed in v
            {newest.version}
          </DialogTitle>
        </DialogHeader>
        <VersionCompareSlider
          before={{ label: `v${previous.version}`, url: previous.fileUrl! }}
          after={{ label: `v${newest.version}`, url: newest.fileUrl! }}
        />
        <p className="text-xs text-muted-foreground">
          Drag the line (or use arrow keys) to sweep between the previous and
          current upload.
        </p>
      </DialogContent>
    </Dialog>
  );
}
