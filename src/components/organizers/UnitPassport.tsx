/**
 * What this unit is — the machine's own page in the show's programme.
 *
 * An organizer selling a slot, and a venue asking what is arriving, both need
 * the same thing: a picture, what it holds, and what it hands out. All of it
 * already existed for the public catalogue and was never shown inside the
 * portal, so a host running five of our machines couldn't tell a visitor what
 * one of them was.
 */

import Image from "next/image";
import { Boxes, Cog, Gift, Sparkles, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MachineSpec } from "@/lib/queries/organizers";

interface UnitPassportProps {
  spec: MachineSpec;
  /** Shown beside the type name, e.g. the unit's serial or firmware. */
  footnote?: string;
}

function ChipRow({
  icon: Icon,
  label,
  values,
}: {
  icon: React.ElementType;
  label: string;
  values: string[];
}) {
  if (values.length === 0) return null;
  return (
    <div className="py-3">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon size={12} /> {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Badge key={value} variant="outline" className="text-[0.65rem] font-normal">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function UnitPassport({ spec, footnote }: UnitPassportProps) {
  return (
    <Card className="overflow-hidden">
      {spec.heroImageUrl && (
        <div className="relative aspect-[16/9] w-full bg-foreground/5">
          <Image
            src={spec.heroImageUrl}
            alt={spec.name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-heading text-sm font-semibold text-foreground">
            {spec.name}
          </p>
          {footnote && (
            <p className="text-xs text-muted-foreground">{footnote}</p>
          )}
        </div>
        {spec.tagline && (
          <p className="mt-1 text-xs text-muted-foreground">{spec.tagline}</p>
        )}

        <div className="mt-2 divide-y divide-border/50">
          {spec.capacityLabel && (
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Boxes size={12} /> Capacity
              </span>
              <span className="text-sm font-medium text-foreground">
                {spec.capacityLabel}
              </span>
            </div>
          )}
          <ChipRow icon={Cog} label="Dispense" values={spec.mechanisms} />
          <ChipRow icon={Gift} label="Hands out" values={spec.dispenses} />
          <ChipRow icon={Sparkles} label="Does" values={spec.features} />
          <ChipRow icon={Target} label="Best for" values={spec.bestFor} />
        </div>
      </CardContent>
    </Card>
  );
}
