/** Intake wizard step 2: Location and date selection */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IntakeStepLocationProps {
  venueName: string;
  postcode: string;
  eventDateStart: string;
  eventDateEnd: string;
  onChange: (field: string, value: string) => void;
}

/** Venue and date inputs for the intake wizard. */
export function IntakeStepLocation(props: IntakeStepLocationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Where and when?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="venueName">Venue</Label>
          <Input
            id="venueName"
            placeholder="ExCeL London, Westfield Stratford, your office…"
            value={props.venueName}
            onChange={(e) => props.onChange("venueName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            placeholder="So we can price the location accurately."
            value={props.postcode}
            onChange={(e) => props.onChange("postcode", e.target.value.toUpperCase())}
            maxLength={8}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDateStart">Starts</Label>
            <Input
              id="eventDateStart"
              type="date"
              value={props.eventDateStart}
              onChange={(e) => props.onChange("eventDateStart", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDateEnd">Ends</Label>
            <Input
              id="eventDateEnd"
              type="date"
              value={props.eventDateEnd}
              onChange={(e) => props.onChange("eventDateEnd", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
