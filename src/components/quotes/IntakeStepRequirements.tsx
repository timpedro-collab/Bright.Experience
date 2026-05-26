/** Intake wizard step 3: Machine, game, and footfall preferences */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IntakeStepRequirementsProps {
  machinePreference: string;
  gamePreference: string;
  footfallEstimate: string;
  onChange: (field: string, value: string) => void;
}

/** Technical requirements and footfall estimate inputs. */
export function IntakeStepRequirements(props: IntakeStepRequirementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What do you have in mind?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="machinePreference">A machine you&apos;ve seen?</Label>
          <Input
            id="machinePreference"
            placeholder="The Claw, the Spin, the Grab — or leave it to us."
            value={props.machinePreference}
            onChange={(e) => props.onChange("machinePreference", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            If you&apos;re not sure — we&apos;ll pick the right one for you.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gamePreference">A game you&apos;ve seen?</Label>
          <Input
            id="gamePreference"
            placeholder="Spin-to-win, memory match, or 'surprise me'."
            value={props.gamePreference}
            onChange={(e) => props.onChange("gamePreference", e.target.value)}
          />
        </div>
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
      </CardContent>
    </Card>
  );
}
