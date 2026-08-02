"use client";

/**
 * Take a show off an organizer.
 *
 * Confirmed in place rather than in a dialog: it's rare and reversible (relink
 * from the picker above), but it does pull the show out of their portal
 * mid-sale, so it shouldn't be a single stray click.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { unlinkShowFromOrganizer } from "@/app/actions/organizer-admin";

interface UnlinkShowButtonProps {
  eventId: string;
  showName: string;
}

export function UnlinkShowButton({ eventId, showName }: UnlinkShowButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleUnlink() {
    startTransition(async () => {
      const result = await unlinkShowFromOrganizer(eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${showName} unlinked`);
      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label={`Unlink ${showName}`}
      >
        <Unlink size={13} /> Unlink
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.65rem] text-muted-foreground">
        They&apos;ll lose access to this show.
      </span>
      <Button variant="destructive" size="sm" onClick={handleUnlink} disabled={pending}>
        {pending ? <Loader2 size={13} className="animate-spin" /> : null}
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
