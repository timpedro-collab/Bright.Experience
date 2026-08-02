"use client";

/**
 * Create / copy / rotate / revoke the pitch link for one sponsor slot.
 *
 * The link is a capability URL, so the controls are deliberately blunt and the
 * expiry is always on screen: rotating is how a leaked link is killed, since
 * the old URL stops resolving the moment a new token is minted.
 *
 * Shared by every surface that shows a slot — the sponsors rate card, the show
 * page and the machine page — because an organizer selling a unit shouldn't
 * have to navigate to a different page to get the link they are about to send.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { shareSlotPitch, revokeSlotPitch } from "@/app/actions/organizers";
import { pitchTokenDaysRemaining } from "@/lib/sponsor-pitch";

export function PitchLinkControls({
  slotId,
  pitchToken,
  expiresAt,
  className,
}: {
  slotId: string;
  pitchToken: string | null;
  /** ISO expiry of the current token, when there is one. */
  expiresAt?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const daysLeft = pitchToken ? pitchTokenDaysRemaining(expiresAt) : 0;

  function share() {
    startTransition(async () => {
      const result = await shareSlotPitch(slotId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(pitchToken ? "Pitch link rotated" : "Pitch link created");
      router.refresh();
    });
  }

  function revoke() {
    startTransition(async () => {
      const result = await revokeSlotPitch(slotId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pitch link revoked");
      router.refresh();
    });
  }

  async function copy() {
    if (!pitchToken) return;
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    await navigator.clipboard.writeText(`${origin}/sponsor/${pitchToken}`);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pitchToken) {
    return (
      <div className={className}>
        <Button variant="brand" size="sm" onClick={share} disabled={pending}>
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Link2 size={14} />
          )}
          Create pitch link
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="glass" size="sm" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          Copy link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={share}
          disabled={pending}
          aria-label="Rotate pitch link"
        >
          <RefreshCw size={14} />
          Rotate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={revoke}
          disabled={pending}
          aria-label="Revoke pitch link"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          Revoke
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {daysLeft > 0
          ? `Link is live · expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
          : "Link has expired — rotate it to send again"}
      </p>
    </div>
  );
}
