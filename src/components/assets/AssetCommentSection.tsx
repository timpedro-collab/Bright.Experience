/** Expandable comment section for an asset row — wraps AssetCommentThread. */
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { AssetCommentThread } from "./AssetCommentThread";
import type { Comment } from "@/types";

interface AssetCommentSectionProps {
  comments: Comment[];
  assetId: string;
  eventId: string;
  currentUserId: string;
  currentVersion?: number;
}

export function AssetCommentSection({
  comments,
  assetId,
  eventId,
  currentUserId,
  currentVersion,
}: AssetCommentSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-3 pb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <MessageCircle size={12} />
        {comments.length > 0
          ? `${comments.length} comment${comments.length === 1 ? "" : "s"}`
          : "Add comment"}
      </button>
      {open && (
        <div className="mt-3 ml-1">
          <AssetCommentThread
            comments={comments}
            assetId={assetId}
            eventId={eventId}
            currentUserId={currentUserId}
            currentVersion={currentVersion}
          />
        </div>
      )}
    </div>
  );
}
