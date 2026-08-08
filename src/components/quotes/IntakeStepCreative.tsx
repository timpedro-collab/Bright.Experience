/**
 * Intake wizard step 3: "The brief" — one open field, one scope question,
 * and footfall only when the quiz didn't already capture the crowd.
 *
 * Field discipline (UX subtraction audit): every field here beat the test
 * "could the walkthrough call ask this better?". Machine preference, game
 * preference, and special requirements used to be three separate inputs —
 * the walkthrough asks all of them better, so they folded into the single
 * open text field (whatever the customer volunteers still reaches the AE).
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SCOPE_OPTIONS = [
  { value: "one_off", label: "A one-off event" },
  { value: "campaign", label: "Part of a wider campaign" },
  { value: "series", label: "A series of events" },
  { value: "unsure", label: "Not sure yet" },
] as const;

interface IntakeStepCreativeProps {
  creativeNeeds: string;
  engagementScope: string;
  footfallEstimate: string;
  /**
   * When the quiz already captured attendee numbers, asking for footfall
   * again would be a double-ask — the caller hides it.
   */
  showFootfall: boolean;
  onChange: (field: string, value: string) => void;
}

/** The brief: open notes, engagement scope, and (sometimes) footfall. */
export function IntakeStepCreative(props: IntakeStepCreativeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">The brief.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="creativeNeeds">Anything specific in mind?</Label>
          <textarea
            id="creativeNeeds"
            rows={3}
            placeholder="A setup or game you've seen, custom branding, prizes, access or power constraints — broad strokes are fine, the walkthrough covers the detail."
            value={props.creativeNeeds}
            onChange={(e) => props.onChange("creativeNeeds", e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Optional — if you leave it blank, we&apos;ll shape it together on
            the walkthrough call.
          </p>
        </div>
        {props.showFootfall && (
          <div className="space-y-2">
            <Label htmlFor="footfallEstimate">Roughly how busy?</Label>
            <Input
              id="footfallEstimate"
              type="number"
              placeholder="People per day — a rough number is fine."
              value={props.footfallEstimate}
              onChange={(e) => props.onChange("footfallEstimate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We use this to model expected interactions and leads.
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Is this a one-off, or part of something bigger?</Label>
          <p className="text-xs text-muted-foreground">
            Helps us shape the right kind of partnership — optional.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => props.onChange("engagementScope", opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-all",
                  props.engagementScope === opt.value
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
