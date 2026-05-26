/** Interactive ROI calculator — estimates leads and return from event activations. */
"use client";

import { useState, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONVERSION_RATE,
  DEFAULT_LEAD_VALUE,
  computeProspectROI,
  formatGBP,
} from "@/lib/roi";

const DEFAULT = {
  attendees: 2000,
  conversionRate: DEFAULT_CONVERSION_RATE,
  leadValue: DEFAULT_LEAD_VALUE.b2c,
};

export function ROICalculator() {
  const [attendees, setAttendees] = useState(DEFAULT.attendees);
  const [convRate, setConvRate] = useState(DEFAULT.conversionRate);
  const [leadVal, setLeadVal] = useState(DEFAULT.leadValue);

  const clamp = useCallback(
    (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
    []
  );

  const { interactions, leads, revenue } = computeProspectROI({
    attendees,
    conversionRate: convRate,
    leadValue: leadVal,
  });

  return (
    <Card interactive className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-heading text-xl">ROI Calculator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimate the return from a Bright.Blue activation at your event.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <FieldGroup
            label="Expected Attendees"
            value={attendees}
            onChange={(v) => setAttendees(clamp(v, 0, 100000))}
          />
          <FieldGroup
            label="Conversion Rate (%)"
            value={convRate}
            onChange={(v) => setConvRate(clamp(v, 0, 100))}
          />
          <FieldGroup
            label="Avg Lead Value (£)"
            value={leadVal}
            onChange={(v) => setLeadVal(clamp(v, 0, 10000))}
          />
        </div>

        <div className="grid gap-4 rounded-[var(--radius-control)] bg-secondary/60 p-5 sm:grid-cols-3">
          <Stat label="Est. Interactions" value={interactions.toLocaleString("en-GB")} />
          <Stat label="Est. Leads" value={leads.toLocaleString("en-GB")} />
          <Stat label="Est. Revenue" value={formatGBP(revenue)} highlight />
        </div>
      </CardContent>
    </Card>
  );
}

function FieldGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-center"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-overline text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-heading mt-1 text-2xl font-bold",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
