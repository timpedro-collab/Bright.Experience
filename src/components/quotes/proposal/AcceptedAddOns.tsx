/** One-click capability add-ons on an accepted proposal — the moment the buyer has said yes and is warmest, per docs/19 (add-ons at acceptance). */
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateQuoteCapabilities } from "@/app/actions/quotes";
import { CAPABILITIES } from "@/lib/capabilities";

interface AcceptedAddOnsProps {
  quoteId: string;
  currentAddons: string[];
}

export function AcceptedAddOns({ quoteId, currentAddons }: AcceptedAddOnsProps) {
  const [addons, setAddons] = useState(currentAddons);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const offerable = CAPABILITIES.filter((c) => !addons.includes(c.slug));

  if (offerable.length === 0) {
    return null;
  }

  async function handleAdd(slug: string, outcome: string) {
    setPendingSlug(slug);
    try {
      const result = await updateQuoteCapabilities(quoteId, [...addons, slug]);
      if (result.success) {
        setAddons(result.data.addons);
        toast.success("Added", { description: outcome });
      } else {
        toast.error("Couldn't add that", { description: result.error });
      }
    } finally {
      setPendingSlug(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        While we build yours
      </p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">
        Add a layer to your activation
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Anything you add here lands in the same build — priced as a named line
        item, confirmed by your event lead before anything is charged.
      </p>
      <ul className="mt-4 space-y-2">
        {offerable.map((cap) => (
          <li key={cap.slug} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{cap.outcome}</p>
              <p className="text-xs text-muted-foreground">{cap.mechanism}</p>
            </div>
            <Button
              variant="glass"
              size="sm"
              disabled={pendingSlug !== null}
              onClick={() => handleAdd(cap.slug, cap.outcome)}
            >
              {pendingSlug === cap.slug ? "Adding…" : "Add"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
