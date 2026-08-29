/**
 * Share actions on the Event Wrapped page — copy the pre-written LinkedIn
 * text and download the share card. Client component for clipboard access.
 */
"use client";

import { useState } from "react";
import { Check, Copy, ImageDown } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WrappedShareActionsProps {
  shareText: string;
  cardUrl: string;
}

export function WrappedShareActions({
  shareText,
  cardUrl,
}: WrappedShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the text is visible on the page to select */
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Button onClick={copyShareText} variant="brand" size="lg">
        {copied ? (
          <>
            <Check size={16} className="mr-2" />
            Copied
          </>
        ) : (
          <>
            <Copy size={16} className="mr-2" />
            Copy the post text
          </>
        )}
      </Button>
      {/* The Wrapped page pins its subtree to Ink via `theme-dark`, so the
          outline variant's tokens resolve to the dark palette on their own. */}
      <Button asChild variant="outline" size="lg">
        <a href={cardUrl} download>
          <ImageDown size={16} className="mr-2" />
          Download the card (PNG)
        </a>
      </Button>
    </div>
  );
}
