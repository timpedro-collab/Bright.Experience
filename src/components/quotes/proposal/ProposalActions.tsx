"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptQuote, declineQuote } from "@/app/actions/quotes";
import { celebrateBig } from "@/lib/celebrate";

interface ProposalActionsProps {
  quoteId: string;
  canRespond: boolean;
}

export function ProposalActions({ quoteId, canRespond }: ProposalActionsProps) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  if (!canRespond) return null;

  async function handle(action: "accept" | "decline") {
    setLoading(action);
    try {
      const fn = action === "accept" ? acceptQuote : declineQuote;
      await fn(quoteId);
      if (action === "accept") {
        toast.success("Proposal accepted", {
          description: "We'll be in touch to kick off your activation.",
        });
        celebrateBig();
      } else {
        toast.info("Proposal declined", { description: "Thanks for letting us know." });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button
        onClick={() => handle("accept")}
        disabled={!!loading}
        variant="brand"
        size="lg"
        className="sm:flex-1 md:max-w-xs"
      >
        <Check className="h-4 w-4" />
        {loading === "accept" ? "Accepting…" : "Accept proposal"}
      </Button>
      <button
        type="button"
        onClick={() => handle("decline")}
        disabled={!!loading}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {loading === "decline" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
