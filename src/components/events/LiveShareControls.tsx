/** Create, copy and revoke token-gated public live-dashboard links. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  issueLiveShareLink,
  revokeLiveShareLink,
} from "@/app/actions/live-share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface LiveShareControlsProps {
  eventId: string;
  token: string | null;
  expiresAt: string | null;
}

/** Manage the view-only live metrics link for stakeholders. */
export function LiveShareControls({
  eventId,
  token,
  expiresAt,
}: LiveShareControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/live/${token}`
      : "";

  function createLink() {
    startTransition(async () => {
      const result = await issueLiveShareLink(eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Share link created");
      router.refresh();
    });
  }

  function revoke() {
    startTransition(async () => {
      const result = await revokeLiveShareLink(eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Share link revoked");
      router.refresh();
    });
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <Button variant="brand" size="sm" onClick={createLink} disabled={pending}>
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Link2 size={14} />
        )}
        Create share link
      </Button>
    );
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          readOnly
          value={shareUrl}
          aria-label="Live dashboard share link"
          className="font-mono text-xs"
        />
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={revoke}
          disabled={pending}
          aria-label="Revoke share link"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          Revoke
        </Button>
      </div>
      {expiryLabel && (
        <p className="text-xs text-muted-foreground">
          Link expires {expiryLabel}
        </p>
      )}
    </div>
  );
}
