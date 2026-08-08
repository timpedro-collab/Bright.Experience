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
      {/* The Wrapped page has a hardcoded dark backdrop, so the outline
          variant's theme tokens (dark text in light mode) would be
          unreadable — style the surface explicitly. */}
      <Button
        asChild
        variant="outline"
        size="lg"
        className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
      >
        <a href={cardUrl} download>
          <ImageDown size={16} className="mr-2" />
          Download the card (PNG)
        </a>
      </Button>
    </div>
  );
}
