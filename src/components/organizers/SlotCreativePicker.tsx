"use client";

/**
 * Attach the show's creative to a sponsor slot.
 *
 * The options are the show's own asset library, so a sponsor's artwork goes
 * through the same upload and review pipeline as everything else. Toggling is
 * optimistic-free on purpose: the server owns the list, and a failed write
 * must not leave the row looking attached.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { attachSlotCreatives } from "@/app/actions/organizers";
import { cn } from "@/lib/utils";
import type { ShowCreativeOption } from "@/lib/queries/organizers";

interface Props {
  slotId: string;
  attachedIds: string[];
  options: ShowCreativeOption[];
}

export function SlotCreativePicker({ slotId, attachedIds, options }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const attachedCount = attachedIds.length;

  function toggle(assetId: string) {
    const next = attachedIds.includes(assetId)
      ? attachedIds.filter((id) => id !== assetId)
      : [...attachedIds, assetId];

    startTransition(async () => {
      const result = await attachSlotCreatives(slotId, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(next.length > attachedCount ? "Creative attached" : "Creative removed");
      router.refresh();
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No uploaded creative on this show yet.
      </p>
    );
  }

  return (
    <div>
      <Button
        variant="glass"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ImageIcon size={14} />
        {attachedCount > 0 ? `Creative (${attachedCount})` : "Attach creative"}
      </Button>

      {open && (
        <ul className="mt-2 space-y-1 rounded-[var(--radius-card)] border border-border/60 p-2">
          {options.map((option) => {
            const attached = attachedIds.includes(option.id);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => toggle(option.id)}
                  disabled={pending}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-[var(--radius-chip)] px-2 py-1.5 text-left text-xs transition-colors",
                    attached ? "bg-brand/10 text-foreground" : "hover:bg-muted"
                  )}
                >
                  <span className="truncate">{option.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {option.reviewStatus !== "approved" && (
                      <Badge variant="outline" className="text-[0.6rem]">
                        Unapproved
                      </Badge>
                    )}
                    {pending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      attached && <Check size={12} />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
