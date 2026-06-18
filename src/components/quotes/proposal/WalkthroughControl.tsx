"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setProposalWalkthrough } from "@/app/actions/quotes";

interface WalkthroughControlProps {
  quoteId: string;
  initialUrl: string | null;
  completedAt: string | null;
}

export function WalkthroughControl({
  quoteId,
  initialUrl,
  completedAt,
}: WalkthroughControlProps) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [revealed, setRevealed] = useState(Boolean(completedAt));
  const [saving, startSave] = useTransition();

  function saveUrl() {
    startSave(async () => {
      const res = await setProposalWalkthrough(quoteId, { url });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Walkthrough link saved");
    });
  }

  function toggleReveal() {
    const next = !revealed;
    startSave(async () => {
      const res = await setProposalWalkthrough(quoteId, { markComplete: next });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setRevealed(next);
      toast.success(next ? "Pricing revealed to customer" : "Pricing hidden until walkthrough");
    });
  }

  return (
    <Card tone="subtle" className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Walkthrough &amp; pricing reveal</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        The customer&apos;s proposal hides the investment section until the
        walkthrough call. Set the scheduler link and reveal pricing once
        you&apos;ve walked them through it.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://cal.com/brightblue/15min"
          className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button variant="outline" size="sm" onClick={saveUrl} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Save link
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-sm">
          Pricing is currently{" "}
          <span className={revealed ? "text-success font-medium" : "text-warning font-medium"}>
            {revealed ? "visible" : "hidden"}
          </span>{" "}
          to the customer.
        </span>
        <Button variant={revealed ? "ghost" : "brand"} size="sm" onClick={toggleReveal} disabled={saving}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? "Hide pricing" : "Reveal pricing"}
        </Button>
      </div>
    </Card>
  );
}
