/**
 * RefineDrawer — the only place a customer interacts with capabilities as a list.
 *
 * Opens from the right when the customer clicks `Refine` on the match card. Each
 * capability is one row: outcome line in the foreground, mechanism muted below,
 * trailing toggle. Off rows dim; on rows are full opacity. No checkbox theatre.
 *
 * Closing the drawer cancels. The only positive action is `Save my choices`.
 */
"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CAPABILITIES, type Capability } from "@/lib/capabilities";
import { cn } from "@/lib/utils";

interface RefineDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currently selected capability slugs (mirrors the chips on the match card). */
  selected: ReadonlyArray<string>;
  /** Called when the customer clicks Save. The parent decides what to do with the new list. */
  onSave: (slugs: string[]) => void;
}

export function RefineDrawer({
  open,
  onOpenChange,
  selected,
  onSave,
}: RefineDrawerProps) {
  // Local draft so toggling doesn't recompute the match card mid-edit.
  const [draft, setDraft] = useState<string[]>(() => [...selected]);

  // Re-sync the draft each time the drawer opens, so the customer sees their
  // last committed choices — not an in-progress edit they abandoned.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft([...selected]);
    }
  }, [open, selected]);

  function toggle(slug: string) {
    setDraft((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-6 pb-4 pt-6">
          <SheetTitle className="text-heading text-xl text-foreground">
            Tailor the experience
          </SheetTitle>
          <SheetDescription>
            Toggle off anything that doesn&apos;t fit. We&apos;ll only price what stays on.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ul className="space-y-3">
            {CAPABILITIES.map((cap) => {
              const on = draft.includes(cap.slug);
              return (
                <li key={cap.slug}>
                  <CapabilityRow capability={cap} on={on} onToggle={() => toggle(cap.slug)} />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border bg-muted/40 px-6 py-4">
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={() => onSave([...draft])}
          >
            Save my choices
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CapabilityRowProps {
  capability: Capability;
  on: boolean;
  onToggle: () => void;
}

function CapabilityRow({ capability, on, onToggle }: CapabilityRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "group flex w-full items-center gap-4 rounded-[var(--radius-control)] border border-border/60 bg-muted/40 p-4 text-left",
        "transition-all duration-150",
        "hover:border-primary/30 hover:bg-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on
          ? "border-primary/50 bg-primary/10 opacity-100"
          : "opacity-70 hover:opacity-100"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{capability.outcome}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {capability.mechanism}
        </p>
      </div>
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          on
            ? "border-primary/60 bg-[linear-gradient(90deg,hsl(230,93%,53%),hsl(189,100%,75%))]"
            : "border-white/15 bg-muted/40"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
            on ? "left-[calc(100%-1.125rem)]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
