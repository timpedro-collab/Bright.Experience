/** Intake wizard step 4: Creative needs and budget indication */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [
  { value: "under_5k", label: "Under £5,000" },
  { value: "5k_10k", label: "£5,000 – £10,000" },
  { value: "10k_20k", label: "£10,000 – £20,000" },
  { value: "20k_plus", label: "£20,000+" },
  { value: "flexible", label: "Flexible / Not Sure" },
] as const;

interface IntakeStepCreativeProps {
  creativeNeeds: string;
  specialRequirements: string;
  budgetIndication: string;
  onChange: (field: string, value: string) => void;
}

/** Creative needs, special requirements, and budget indication. */
export function IntakeStepCreative(props: IntakeStepCreativeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">The creative side.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="creativeNeeds">Anything specific in mind?</Label>
          <textarea
            id="creativeNeeds"
            rows={3}
            placeholder="Custom branding, a bespoke game, branded prizes — broad strokes are fine."
            value={props.creativeNeeds}
            onChange={(e) => props.onChange("creativeNeeds", e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialRequirements">Anything else we should know?</Label>
          <Input
            id="specialRequirements"
            placeholder="Wheelchair access, outdoor-rated, power supply, sound limits…"
            value={props.specialRequirements}
            onChange={(e) => props.onChange("specialRequirements", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>A rough budget range?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => props.onChange("budgetIndication", opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-all",
                  props.budgetIndication === opt.value
                    ? "border-brand bg-brand/8 text-brand font-medium"
                    : "border-border text-muted-foreground hover:border-brand/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
