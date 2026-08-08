/** Inline pencil-edit affordance for the event title (customer campaign naming). */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameEvent } from "@/app/actions/events";

interface RenameEventControlProps {
  eventId: string;
  name: string;
}

/**
 * Pencil button next to the event title. Clicking it swaps in an inline
 * input; saving calls `renameEvent` and refreshes the route so the new name
 * lands everywhere it's server-rendered (hero, breadcrumbs, footer).
 */
export function RenameEventControl({ eventId, name }: RenameEventControlProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function open() {
    setDraft(name);
    setError(null);
    setEditing(true);
  }

  function submit() {
    startTransition(async () => {
      const result = await renameEvent(eventId, draft);
      if (result.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Could not rename the event.");
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Rename event"
        className="inline-flex size-7 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground align-middle"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1 align-middle">
      <span className="inline-flex items-center gap-1.5">
        <Input
          autoFocus
          value={draft}
          aria-label="Event name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-8 w-64 max-w-[60vw] text-sm font-normal"
          disabled={isPending}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Save name"
          onClick={submit}
          disabled={isPending}
        >
          <Check className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Cancel rename"
          onClick={() => setEditing(false)}
          disabled={isPending}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </span>
      {error && (
        <span role="alert" className="text-xs font-normal text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
