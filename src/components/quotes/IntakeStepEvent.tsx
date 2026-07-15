/**
 * Intake wizard step 1: what the experience should do.
 *
 * Multi-select of the capabilities Bright.Blue actually offers. The always-on
 * deliverables are shown as "included as standard" so the customer sees what
 * every activation ships with; the tailorable capabilities are multi-select
 * toggles that travel straight into the quote's `addons` — the same canonical
 * slugs that build the proposal document and drive its pricing.
 */
"use client";

import {
  Gift,
  CreditCard,
  Activity,
  Megaphone,
  ListChecks,
  UserPlus,
  ShieldCheck,
  Gamepad2,
  MailCheck,
  Palette,
  BarChart3,
  Truck,
  Check,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Always-on deliverables — shown as reassurance, never priced separately. */
const INCLUDED: { label: string; icon: LucideIcon }[] = [
  { label: "Gamified tap-to-play", icon: Gamepad2 },
  { label: "Branded wrap & creative build", icon: Palette },
  { label: "Live engagement dashboard & report", icon: BarChart3 },
  { label: "Delivery, install & breakdown", icon: Truck },
];

/**
 * Tailorable capabilities the customer multi-selects. `slug` MUST match the
 * canonical vocabulary in `@/lib/capabilities` so the selection prices and
 * builds the proposal correctly. Ordered to lead with the dispense model.
 */
export const CAPABILITY_OPTIONS: {
  slug: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
}[] = [
  {
    slug: "sampling-unlock",
    label: "Free sampling",
    blurb: "Dispense a free product or sample on every win.",
    icon: Gift,
  },
  {
    slug: "payments-onunit",
    label: "Take payment on the unit",
    blurb: "Sell product directly with an on-board card terminal.",
    icon: CreditCard,
  },
  {
    slug: "lead-capture",
    label: "Lead capture",
    blurb: "Collect opted-in contacts and first-party data from every play.",
    icon: MailCheck,
  },
  {
    slug: "live-telemetry",
    label: "Live data dashboard",
    blurb: "Your team watches plays and leads land in real time.",
    icon: Activity,
  },
  {
    slug: "dynamic-sponsors",
    label: "Rotating sponsor ads",
    blurb: "Monetise screen time with sponsor creative between plays.",
    icon: Megaphone,
  },
  {
    slug: "survey-layer",
    label: "In-play survey",
    blurb: "Drop a smart question between rounds to qualify visitors.",
    icon: ListChecks,
  },
  {
    slug: "linkedin-follow",
    label: "Follow-to-unlock",
    blurb: "Gate the reward behind a social follow to grow your audience.",
    icon: UserPlus,
  },
  {
    slug: "age-verification",
    label: "Age verification",
    blurb: "Age-gate the experience for alcohol or 18+ products.",
    icon: ShieldCheck,
  },
];

interface IntakeStepEventProps {
  selectedAddons: string[];
  objective: string;
  onToggleAddon: (slug: string) => void;
  onChange: (field: string, value: string) => void;
}

/** Multi-select capability picker + free-text objective. */
export function IntakeStepEvent({
  selectedAddons = [],
  objective = "",
  onToggleAddon,
  onChange,
}: IntakeStepEventProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tell us about the moment.</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick everything you want the experience to do — it shapes your
          proposal and the pricing. Choose as many as you like.
        </p>
      </CardHeader>
      <CardContent className="space-y-7">
        <div>
          <p className="text-overline text-muted-foreground mb-3">
            Choose the capabilities you want
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAPABILITY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = selectedAddons.includes(opt.slug);
              return (
                <button
                  key={opt.slug}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => onToggleAddon(opt.slug)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    selected
                      ? "border-brand bg-brand/8"
                      : "border-border hover:border-brand/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-brand/40 bg-brand/15 text-brand"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        selected ? "text-foreground" : "text-foreground/90"
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {opt.blurb}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-border text-transparent group-hover:border-brand/40"
                    )}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-overline text-muted-foreground mb-3">
            Included as standard with every activation
          </p>
          <div className="flex flex-wrap gap-2">
            {INCLUDED.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-foreground/80"
                >
                  <Icon size={13} className="text-brand" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objective">
            Anything else this moment needs to do?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
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
