/**
 * AnnotatablePreview — a creative image the reviewer can mark up with
 * region-anchored notes. Click anywhere on the image to drop a numbered pin
 * and attach a comment; existing pins are listed below with a resolve toggle.
 *
 * Coordinates are stored as a percentage of the image box so pins stay
 * anchored regardless of the rendered size.
 */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addAssetAnnotation,
  resolveAssetAnnotation,
} from "@/app/actions/asset-annotations";
import type { AssetAnnotation } from "@/types";

interface Draft {
  x: number;
  y: number;
}

export function AnnotatablePreview({
  assetId,
  eventId,
  assetVersionId,
  imageUrl,
  initialAnnotations,
}: {
  assetId: string;
  eventId: string;
  assetVersionId?: string;
  imageUrl: string;
  initialAnnotations: AssetAnnotation[];
}) {
  const router = useRouter();
  const [annotations, setAnnotations] =
    React.useState<AssetAnnotation[]>(initialAnnotations);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (pending) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDraft({ x: clamp(x), y: clamp(y) });
    setBody("");
  }

  function submitDraft() {
    if (!draft || body.trim().length === 0) return;
    startTransition(async () => {
      const result = await addAssetAnnotation({
        assetId,
        eventId,
        assetVersionId,
        x: draft.x,
        y: draft.y,
        w: 0,
        h: 0,
        body: body.trim(),
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not save the note.");
        return;
      }
      setAnnotations((prev) => [
        ...prev,
        {
          id: result.data.id,
          assetId,
          assetVersionId,
          eventId,
          authorId: "you",
          authorName: "You",
          x: draft.x,
          y: draft.y,
          w: 0,
          h: 0,
          body: body.trim(),
          resolved: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft(null);
      setBody("");
      router.refresh();
    });
  }

  function toggleResolve(annotation: AssetAnnotation) {
    startTransition(async () => {
      const result = await resolveAssetAnnotation(
        annotation.id,
        eventId,
        !annotation.resolved,
      );
      if (!result.success) {
        toast.error(result.error ?? "Could not update the note.");
        return;
      }
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotation.id ? { ...a, resolved: !a.resolved } : a,
        ),
      );
    });
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-muted/30"
        onClick={handleImageClick}
        role="presentation"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Uploaded creative"
          className="block w-full cursor-crosshair select-none"
          draggable={false}
        />
        {annotations.map((a, i) => (
          <Pin key={a.id} index={i + 1} annotation={a} />
        ))}
        {draft && (
          <span
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground"
            style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
          >
            +
          </span>
        )}
      </div>

      {draft && (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-overline text-muted-foreground">
              Note at this point
            </span>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancel note"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What needs to change here?"
            rows={2}
            disabled={pending}
            autoFocus
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={pending || body.trim().length === 0}
              onClick={submitDraft}
            >
              <MessageSquarePlus className="h-4 w-4" /> Add note
            </Button>
          </div>
        </div>
      )}

      {annotations.length > 0 ? (
        <ul className="space-y-1.5">
          {annotations.map((a, i) => (
            <li
              key={a.id}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                a.resolved
                  ? "border-border bg-muted/30 text-muted-foreground line-through"
                  : "border-border bg-card text-foreground",
              )}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 break-words">{a.body}</span>
              <button
                type="button"
                onClick={() => toggleResolve(a)}
                disabled={pending}
                className="shrink-0 text-muted-foreground hover:text-emerald-500"
                aria-label={a.resolved ? "Reopen note" : "Resolve note"}
                title={a.resolved ? "Reopen" : "Resolve"}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !draft && (
          <p className="text-xs text-muted-foreground">
            Click anywhere on the creative to drop a note for the customer.
          </p>
        )
      )}
    </div>
  );
}

function Pin({
  index,
  annotation,
}: {
  index: number;
  annotation: AssetAnnotation;
}) {
  return (
    <span
      className={cn(
        "absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow",
        annotation.resolved
          ? "border-emerald-500 bg-emerald-500/80 text-white"
          : "border-white bg-primary text-primary-foreground",
      )}
      style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
      title={annotation.body}
    >
      {index}
    </span>
  );
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}
