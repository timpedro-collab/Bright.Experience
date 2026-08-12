"use client";

/**
 * Post-reveal deal explorer for the proposal page — the customer switches
 * tailorable capabilities into their quoted package and watches the
 * investment respond, then asks their event lead to confirm the new shape.
 *
 * Renders only when the price is revealed (the walkthrough gate has been
 * passed), so a hard number is never shown before the call. Nothing here
 * charges anything: "Request this configuration" merges the add-ons onto
 * the quote and pings the AE, who confirms pricing with the customer.
 */

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  recordProposalExplorerChange,
  requestProposalConfiguration,
} from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoneyFromPence } from "@/lib/currency";
import {
  computeExplorerTotals,
  explorerOptionsForQuote,
} from "@/lib/proposals/proposal-explorer";
import { formatGBP } from "@/lib/roi";

interface ProposalExplorerProps {
  quoteId: string;
  /** The quoted all-in fee, in pence (`quote.total_amount`). */
  baseFeePence: number;
  /** Capability slugs already included in the package. */
  selectedAddonSlugs: string[];
}

/** Debounce for the play-telemetry ping so dragging toggles isn't chatty. */
const TELEMETRY_DEBOUNCE_MS = 3_000;

export function ProposalExplorer({
  quoteId,
  baseFeePence,
  selectedAddonSlugs,
}: ProposalExplorerProps) {
  const [toggled, setToggled] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const telemetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options = explorerOptionsForQuote(selectedAddonSlugs);
  const totals = computeExplorerTotals(baseFeePence, selectedAddonSlugs, toggled);

  // Fire-and-forget interaction telemetry, debounced. Never blocks the UI.
  useEffect(() => {
    if (toggled.length === 0) return;
    if (telemetryTimer.current) clearTimeout(telemetryTimer.current);
    const snapshot = [...toggled];
    telemetryTimer.current = setTimeout(() => {
      void recordProposalExplorerChange(quoteId, snapshot).catch(() => {});
    }, TELEMETRY_DEBOUNCE_MS);
    return () => {
      if (telemetryTimer.current) clearTimeout(telemetryTimer.current);
    };
  }, [toggled, quoteId]);

  if (options.length === 0) return null;

  const toggle = (slug: string) => {
    setError(null);
    setToggled((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await requestProposalConfiguration(quoteId, toggled);
    setSubmitting(false);
    if (result.success) {
      setRequested(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <Card className="mt-10 p-8">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" aria-hidden />
        <h3 className="text-heading text-lg font-bold text-foreground">
          Make it yours
        </h3>
      </div>
      <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
        Your package is priced and locked. If you want more from the day,
        switch anything below into the mix and watch the investment update.
        Nothing is charged until your event lead confirms it with you.
      </p>

      <ul className="mt-6 divide-y divide-border/40">
        {options.map((option) => {
          const checked = toggled.includes(option.slug);
          return (
            <li key={option.slug} className="py-3">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span className="flex items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(option.slug)}
                    aria-label={option.outcome}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {option.outcome}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.mechanism}
                    </span>
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                  +{formatMoneyFromPence(option.pricePence)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border/40 pt-5">
        <div>
          <p className="text-overline text-muted-foreground">Your investment</p>
          <p className="text-3xl font-bold tabular-nums text-primary">
            {formatGBP(totals.totalPence / 100)}
          </p>
          {totals.addonsPence > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatGBP(totals.baseFeePence / 100)} package +{" "}
              {formatGBP(totals.addonsPence / 100)} in add-ons
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              The package as quoted.
            </p>
          )}
        </div>
        {requested ? (
          <p className="max-w-[36ch] text-sm text-success">
            Done — your event lead will confirm the updated configuration and
            pricing with you before anything changes.
          </p>
        ) : (
          <Button
            onClick={submit}
            disabled={toggled.length === 0 || submitting}
          >
            {submitting ? "Sending…" : "Request this configuration"}
          </Button>
        )}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
