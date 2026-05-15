/** Intake wizard step 1: Event type and objective selection */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sparkles, ShoppingBag, Gift, Layers, Settings } from "lucide-react";

const EVENT_TYPES = [
  { value: "activation", label: "Brand Activation", icon: Sparkles },
  { value: "sampling", label: "Product Sampling", icon: ShoppingBag },
  { value: "vending", label: "Vending", icon: Gift },
  { value: "hybrid", label: "Hybrid", icon: Layers },
  { value: "custom", label: "Custom", icon: Settings },
] as const;

interface IntakeStepEventProps {
  eventType: string;
  objective: string;
  onChange: (field: string, value: string) => void;
}

/** Radio-card selection for event type and free-text objective. */
export function IntakeStepEvent({ eventType, objective, onChange }: IntakeStepEventProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tell us about the moment.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EVENT_TYPES.map((et) => {
            const Icon = et.icon;
            const selected = eventType === et.value;
            return (
              <button
                key={et.value}
                type="button"
                onClick={() => onChange("eventType", et.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  selected
                    ? "border-brand bg-brand/8 text-brand"
                    : "border-border hover:border-brand/40 text-muted-foreground"
                )}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{et.label}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <Label htmlFor="objective">What should this moment do?</Label>
          <Input
            id="objective"
            placeholder="A line is plenty — pipeline, sampling, brand recall…"
            value={objective}
            onChange={(e) => onChange("objective", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
