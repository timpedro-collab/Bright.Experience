/** Threaded comment display + compose form for an asset. */
"use client";

import { useState, useTransition, useOptimistic, useMemo } from "react";
import { MessageCircle, Reply, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addComment, deleteComment } from "@/app/actions/comments";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types";

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

interface AssetCommentThreadProps {
  comments: Comment[];
  assetId: string;
  eventId: string;
  currentUserId: string;
}

export function AssetCommentThread({
  comments,
  assetId,
  eventId,
  currentUserId,
}: AssetCommentThreadProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  // New comments appear in the thread the moment they're sent; the server
  // copy replaces them once the action's revalidation lands. A failed send
  // reverts the entry and restores the drafted text.
  const [optimisticComments, appendOptimistic] = useOptimistic(
    comments,
    (state: Comment[], c: Comment) => [...state, c]
  );

  const rootComments = useMemo(
    () => optimisticComments.filter((c) => !c.parentId),
    [optimisticComments],
  );
  const repliesMap = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    for (const c of optimisticComments) {
      if (c.parentId) {
        (map[c.parentId] ??= []).push(c);
      }
    }
    return map;
  }, [optimisticComments]);

  function handleSubmit() {
    const text = body.trim();
    if (!text) return;
    const parent = replyTo ?? undefined;
    // Clear the compose box immediately — the comment is already visible.
    setBody("");
    setReplyTo(null);
    startTransition(async () => {
      appendOptimistic({
        id: `optimistic-${Date.now()}`,
        eventId,
        assetId,
        authorId: currentUserId,
        authorName: "You",
        body: text,
        parentId: parent,
        createdAt: new Date().toISOString(),
      });
      const result = await addComment(eventId, assetId, text, parent);
      if (!result.success) {
        toast.error(result.error);
        setBody(text);
        if (parent) setReplyTo(parent);
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
    });
  }

  return (
    <div className="space-y-4">
      {rootComments.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MessageCircle size={12} /> No comments yet
        </p>
      )}

      {rootComments.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          replies={repliesMap[c.id] ?? []}
          repliesMap={repliesMap}
          currentUserId={currentUserId}
          onReply={(id) => setReplyTo(id)}
          onDelete={handleDelete}
          depth={0}
        />
      ))}

      <div className="pt-2 border-t border-border/40">
        {replyTo && (
          <p className="text-xs text-muted-foreground mb-1">
            Replying…{" "}
            <button type="button" onClick={() => setReplyTo(null)} className="underline">
              cancel
            </button>
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Add a comment…"
            className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button size="sm" onClick={handleSubmit} disabled={isPending || !body.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  replies,
  repliesMap,
  currentUserId,
  onReply,
  onDelete,
  depth,
}: {
  comment: Comment;
  replies: Comment[];
  repliesMap: Record<string, Comment[]>;
  currentUserId: string;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  return (
    <div className={cn(depth > 0 && "ml-6 border-l border-border/40 pl-3")}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {comment.authorName ?? "Unknown"}
            </span>{" "}
            <span className="text-muted-foreground">{comment.body}</span>
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-overline text-muted-foreground">
              {relativeTime(comment.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="text-overline text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <Reply size={10} /> Reply
            </button>
            {comment.authorId === currentUserId && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-overline text-destructive/70 hover:text-destructive flex items-center gap-0.5"
              >
                <Trash2 size={10} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {replies.map((r) => (
        <CommentNode
          key={r.id}
          comment={r}
          replies={repliesMap[r.id] ?? []}
          repliesMap={repliesMap}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
