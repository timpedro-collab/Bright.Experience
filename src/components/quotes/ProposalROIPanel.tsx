/** ProposalROIPanel — ROI calculator anchored to the quote's actual price.
 *
 * Investment and estimated leads are sourced from the quote and rendered as
 * read-only context. The customer only nudges the average lead value to see
 * revenue, ROI multiple, and payback months recalculate live.
 */
"use client";

import { useMemo, useState } from "react";
import { Info, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeProposalROI,
  defaultLeadValueForEventType,
  formatGBP,
} from "@/lib/roi";

interface ProposalROIPanelProps {
  totalPence: number;
  estimatedLeads?: number | null;
  eventType?: string | null;
}

export function ProposalROIPanel({
  totalPence,
  estimatedLeads,
  eventType,
}: ProposalROIPanelProps) {
  const defaultValue = useMemo(
    () => defaultLeadValueForEventType(eventType),
    [eventType]
  );
  const [leadValue, setLeadValue] = useState<number>(defaultValue);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const leadsForCalc = estimatedLeads ?? 0;
  const hasLeads = leadsForCalc > 0;

  const { revenue, roiMultiple, paybackMonths } = useMemo(
    () =>
      computeProposalROI({
        estimatedLeads: leadsForCalc,
        leadValue,
        investmentPence: totalPence,
      }),
    [leadsForCalc, leadValue, totalPence]
  );

  return (
    <Card tone="subtle" className="print-break-inside-avoid">
      <CardHeader className="px-10 pt-10 pb-3 md:px-12 md:pt-12">
        <p className="text-overline text-muted-foreground mb-1">Return on investment</p>
        <CardTitle className="text-2xl">What you can expect to earn back</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          A quick view of the financial return, based on the leads we've
          modelled for this activation. Adjust the average lead value to match
          how your team prices a converted customer.
        </p>
      </CardHeader>
      <CardContent className="space-y-7 px-10 pb-10 md:px-12 md:pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ContextChip
            label="Investment"
            value={formatGBP(totalPence / 100)}
          />
          <ContextChip
            label="Modelled leads"
            value={hasLeads ? leadsForCalc.toLocaleString("en-GB") : "—"}
          />
          <div className="rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-4">
            <Label
              htmlFor="lead-value"
              className="text-overline text-muted-foreground"
            >
              Average lead value (£)
            </Label>
            <Input
              id="lead-value"
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              value={leadValue}
              onChange={(e) =>
                setLeadValue(
                  Math.max(0, Math.min(10000, Number(e.target.value) || 0))
                )
              }
              className="mt-1 h-9 border-0 bg-transparent px-0 text-lg font-semibold tabular-nums text-foreground focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.04] sm:grid-cols-3">
          <OutputTile
            label="Estimated revenue"
            value={hasLeads ? formatGBP(revenue) : "—"}
          />
          <OutputTile
            label="ROI multiple"
            value={hasLeads && roiMultiple > 0 ? `${roiMultiple.toFixed(1)}×` : "—"}
            highlight
          />
          <OutputTile
            label="Payback"
            value={
              hasLeads && Number.isFinite(paybackMonths)
                ? `${paybackMonths.toFixed(1)} mo`
                : "—"
            }
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAssumptions((v) => !v)}
            className="no-print inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Info className="h-3.5 w-3.5" />
            {showAssumptions ? "Hide assumptions" : "What does this assume?"}
          </button>
          {showAssumptions && (
            <div className="mt-3 space-y-1.5 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-muted-foreground">
              <p>
                <span className="text-foreground">Revenue</span> = modelled
                leads × average lead value.
              </p>
              <p>
                <span className="text-foreground">ROI multiple</span> = revenue
                ÷ investment. A multiple of <span className="text-foreground">1×</span>{" "}
                means you break even.
              </p>
              <p>
                <span className="text-foreground">Payback</span> = 12 ÷ ROI
                multiple, expressed in months. We cap the display at 36 months.
              </p>
              <p className="pt-1 italic">
                Lead value defaults to £{defaultValue.toLocaleString("en-GB")}{" "}
                based on this activation&apos;s event type. Edit to match your
                team&apos;s economics.
              </p>
            </div>
          )}
        </div>

        {!hasLeads && (
          <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5" />
            <p>
              ROI requires a modelled lead count. We&apos;ll add this once your
              creative briefing is in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-overline text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function OutputTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[hsl(233,50%,9%)] p-6 text-center print-break-inside-avoid">
      <p className="text-overline text-muted-foreground">{label}</p>
      <p
        className={[
          "mt-3 text-display text-3xl font-bold tabular-nums leading-none md:text-4xl",
          highlight ? "text-primary" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
