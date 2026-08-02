/**
 * What the venue needs to know before this unit can stand anywhere.
 *
 * Every exhibition venue asks for footprint, weight, power and connectivity
 * weeks before move-in, and until now an organizer had to email us and wait
 * for a reply. Same numbers, on the page, with a printable version they can
 * forward straight to the venue's operations team.
 *
 * The "indicative" line is not hedging: the figures seeded here are the shape
 * of the specification rather than measured values, and an organizer must not
 * put an unconfirmed number into venue paperwork believing we stand behind it.
 */

import Link from "next/link";
import { Printer, Ruler, Weight, Zap, Wifi, MoveHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { MachineSpec } from "@/lib/queries/organizers";

interface SiteRequirementsProps {
  spec: MachineSpec;
  /** Link to the printable sheet. Omitted where there is nowhere to print from. */
  specSheetHref?: string;
}

function Requirement({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function SiteRequirements({ spec, specSheetHref }: SiteRequirementsProps) {
  const requirements = [
    { icon: Ruler, label: "Footprint", value: spec.footprintMm },
    {
      icon: Weight,
      label: "Weight",
      value: spec.weightKg ? `${spec.weightKg} kg` : null,
    },
    { icon: Zap, label: "Power", value: spec.powerSpec },
    { icon: Wifi, label: "Connectivity", value: spec.connectivity },
    { icon: MoveHorizontal, label: "Clearance", value: spec.clearanceNotes },
  ].filter((r) => r.value);

  if (requirements.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            We haven&apos;t published site requirements for this machine yet. Ask
            your Bright.Blue contact and we&apos;ll send the venue sheet over.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-heading text-sm font-semibold text-foreground">
            What the venue needs
          </p>
          {specSheetHref && (
            <Link
              href={specSheetHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
            >
              <Printer size={12} /> Printable sheet
            </Link>
          )}
        </div>

        <div className="mt-1 divide-y divide-border/50">
          {requirements.map((requirement) => (
            <Requirement key={requirement.label} {...requirement} />
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Indicative figures. Confirm them with your Bright.Blue contact before
          they go into venue paperwork.
        </p>
      </CardContent>
    </Card>
  );
}
