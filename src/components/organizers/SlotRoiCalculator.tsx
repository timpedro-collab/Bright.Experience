/** Interactive cost-per-lead check for the public sponsor pitch page. */
"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoneyFromPence } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SlotRoiCalculatorProps {
  /** Sponsor-facing slot price in minor units. */
  pricePence: number;
  /** Benchmark-backed lower bound of expected leads. */
  leadsLow: number;
  /** Benchmark-backed upper bound of expected leads. */
  leadsHigh: number;
  className?: string;
}

const INPUT_ID = "slot-roi-leads";

function clampLeads(value: number, max: number): number {
  return Math.min(Math.max(1, value), max);
}

function costPerLead(pricePence: number, leads: number): number {
  return Math.round(pricePence / leads);
}

export function SlotRoiCalculator({
  pricePence,
  leadsLow,
  leadsHigh,
  className,
}: SlotRoiCalculatorProps) {
  const maxLeads = leadsHigh * 2;
  const midpoint = Math.round((leadsLow + leadsHigh) / 2);
  const [leads, setLeads] = useState(midpoint);

  if (pricePence <= 0 || leadsHigh <= 0) return null;

  const cplPence = costPerLead(pricePence, leads);
  const benchmarkLowCpl = formatMoneyFromPence(costPerLead(pricePence, leadsHigh));
  const benchmarkHighCpl = formatMoneyFromPence(costPerLead(pricePence, leadsLow));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">What this works out to</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={INPUT_ID}>Leads you expect</Label>
          <Input
            id={INPUT_ID}
            type="number"
            min={1}
            max={maxLeads}
            value={leads}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isNaN(next)) return;
              setLeads(clampLeads(next, maxLeads));
            }}
            className="max-w-[10rem] tabular-nums"
          />
        </div>

        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {formatMoneyFromPence(cplPence)}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">per lead</span>
        </p>

        <p className="text-sm text-muted-foreground">
          Comparable slots capture {leadsLow}–{leadsHigh} leads — that&apos;s {benchmarkLowCpl}{" "}
          to {benchmarkHighCpl} per lead.
        </p>
      </CardContent>
    </Card>
  );
}
