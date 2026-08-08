/** Intake wizard step 5: Contact information */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IntakeStepContactProps {
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  planningMonth: string;
  onChange: (field: string, value: string) => void;
}

/** Contact information fields for the intake wizard. */
export function IntakeStepContact(props: IntakeStepContactProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">And you — who should we send this to?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Your name *</Label>
          <Input
            id="contactName"
            placeholder="Jane Smith"
            value={props.contactName}
            onChange={(e) => props.onChange("contactName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Where to send the proposal *</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="jane@company.com"
            value={props.contactEmail}
            onChange={(e) => props.onChange("contactEmail", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">A number, in case we have a question</Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="+44 7700 900000"
            value={props.contactPhone}
            onChange={(e) => props.onChange("contactPhone", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company or brand</Label>
            <Input
              id="companyName"
              placeholder="Acme Corp"
              value={props.companyName}
              onChange={(e) => props.onChange("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactRole">Your role</Label>
            <Input
              id="contactRole"
              placeholder="Brand Manager"
              value={props.contactRole}
              onChange={(e) => props.onChange("contactRole", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="planningMonth">
            When do you plan next year&apos;s events?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="planningMonth"
            type="month"
            value={props.planningMonth}
            onChange={(e) => props.onChange("planningMonth", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll resurface your results right when they&apos;re most
            useful for the next budget round.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
