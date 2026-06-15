/** Hero "Next Step" card — the most prominent CTA on dashboards and event overviews */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NextStepCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  icon?: React.ElementType;
  tone?: "brand" | "warning" | "success" | "info";
  className?: string;
}

const toneStyles: Record<NonNullable<NextStepCardProps["tone"]>, string> = {
  brand:
    "border-primary/30 bg-[linear-gradient(135deg,hsl(230,93%,53%,0.16),hsl(189,100%,75%,0.06)_60%,hsl(233,56%,11%,0.55))]",
  warning:
    "border-warning/30 bg-[linear-gradient(135deg,hsl(43,90%,56%,0.18),hsl(233,56%,11%,0.55))]",
  success:
    "border-success/30 bg-[linear-gradient(135deg,hsl(143,72%,42%,0.18),hsl(233,56%,11%,0.55))]",
  info:
    "border-info/30 bg-[linear-gradient(135deg,hsl(199,89%,58%,0.18),hsl(233,56%,11%,0.55))]",
};

const iconStyles: Record<NonNullable<NextStepCardProps["tone"]>, string> = {
  brand: "bg-primary/15 text-primary border-primary/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  success: "bg-success/15 text-success border-success/30",
  info: "bg-info/15 text-info border-info/30",
};

export function NextStepCard({
  eyebrow = "Your next step",
  title,
  description,
  primaryAction,
  secondaryAction,
  icon: Icon = Sparkles,
  tone = "brand",
  className,
}: NextStepCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border backdrop-blur-xl",
        "shadow-[var(--bb-shadow-card)]",
        toneStyles[tone],
        className
      )}
    >
      <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-6 md:p-7">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border",
            iconStyles[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-overline text-muted-foreground mb-1">{eyebrow}</p>
          <h2 className="text-heading text-lg font-semibold text-foreground md:text-xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryAction && (
            <Button asChild variant="glass" size="sm">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
          <Button asChild variant="brand">
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative blur orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/12 blur-3xl"
      />
    </div>
  );
}
