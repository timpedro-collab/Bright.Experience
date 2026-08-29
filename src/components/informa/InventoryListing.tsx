/**
 * The drop-in prospectus block: the listing rendered as it would appear in a
 * sponsorship deck, with a one-click copy of the plain-text version so a rep
 * can paste it into their own inventory sheet without retyping a word.
 */
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { INVENTORY_LISTING } from "@/lib/informa/content";

/** The listing as paste-ready plain text, mirroring the rendered block. */
export function listingText(): string {
  return [
    INVENTORY_LISTING.title,
    INVENTORY_LISTING.tier,
    "",
    INVENTORY_LISTING.body,
    "",
    "Includes:",
    ...INVENTORY_LISTING.includes.map((i) => `- ${i}`),
    "",
    INVENTORY_LISTING.priceLine,
  ].join("\n");
}

export function InventoryListing() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listingText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the block below stays selectable */
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">
          {INVENTORY_LISTING.tier}
        </p>
        <h3 className="text-display-grotesk mt-2 text-2xl">{INVENTORY_LISTING.title}</h3>
        <p className="mt-3 leading-relaxed text-muted-foreground">{INVENTORY_LISTING.body}</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {INVENTORY_LISTING.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-cyan" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm font-semibold">{INVENTORY_LISTING.priceLine}</p>
      </div>

      <Button onClick={copy} variant="outline" className="gap-2">
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Copied" : "Copy the listing for your prospectus"}
      </Button>
    </div>
  );
}
