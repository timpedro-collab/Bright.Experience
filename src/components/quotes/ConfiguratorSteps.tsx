/**
 * Step content panels for the Book Now configurator.
 *
 * These are pure presentational pieces — all parent state is owned by
 * {@link ConfigureClient}. Machine and Game steps are catalogue-backed; the
 * addon step keys off `capability_slug` (the canonical vocabulary) so the
 * server action can re-price and validate without ambiguity.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatMoneyFromPence } from "@/lib/currency";
import { spellDateRange } from "@/lib/date-confirm";
import type {
  AddonForConfig,
  GameForConfig,
  MachineForConfig,
} from "@/components/quotes/ConfigureClient";

interface MachineStepProps {
  machines: MachineForConfig[];
  value: string;
  onChange: (id: string) => void;
}

export function MachineStep({ machines, value, onChange }: MachineStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pick your machine</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {machines.map((m) => (
          <CataloguePill
            key={m.id}
            selected={value === m.id}
            onSelect={() => onChange(m.id)}
            title={m.name}
            subtitle={m.tagline ?? undefined}
          />
        ))}
        {machines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            The machine catalogue is being prepared.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface GameStepProps {
  games: GameForConfig[];
  value: string;
  onChange: (id: string) => void;
}

export function GameStep({ games, value, onChange }: GameStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a game</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {games.map((g) => (
          <CataloguePill
            key={g.id}
            selected={value === g.id}
            onSelect={() => onChange(g.id)}
            title={g.name}
            subtitle={g.category ?? undefined}
          />
        ))}
        {games.length === 0 && (
          <p className="text-sm text-muted-foreground">
            The game catalogue is being prepared.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AddonStepProps {
  addons: AddonForConfig[];
  selectedSlugs: string[];
  onToggle: (capabilitySlug: string) => void;
}

export function AddonStep({
  addons,
  selectedSlugs,
  onToggle,
}: AddonStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add-on capabilities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {addons.map((addon) => {
          const checked = selectedSlugs.includes(addon.capabilitySlug);
          return (
            <label
              key={addon.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(addon.capabilitySlug)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {addon.name}
                </p>
                {addon.description && (
                  <p className="text-xs text-muted-foreground">
                    {addon.description}
                  </p>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                +{formatMoneyFromPence(addon.price, { decimals: true })}
              </span>
            </label>
          );
        })}
        {addons.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No add-ons available for this package.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DateStepProps {
  dateStart: string;
  dateEnd: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
}

export function DateStep({
  dateStart,
  dateEnd,
  onChangeStart,
  onChangeEnd,
}: DateStepProps) {
  const spelled = spellDateRange(dateStart, dateEnd);
  return (
    <Card>
      <CardHeader>
        <CardTitle>When&apos;s the event?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateStart">Start date *</Label>
            <Input
              id="dateStart"
              type="date"
              value={dateStart}
              onChange={(e) => onChangeStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateEnd">End date</Label>
            <Input
              id="dateEnd"
              type="date"
              value={dateEnd}
              onChange={(e) => onChangeEnd(e.target.value)}
            />
          </div>
        </div>
        {/* Locale-proof echo: the native picker displays in the browser's
            format, so the parsed date is confirmed back in words. */}
        {spelled && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Your event: <span className="font-medium text-foreground">{spelled}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface CataloguePillProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
}

function CataloguePill({
  selected,
  onSelect,
  title,
  subtitle,
}: CataloguePillProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border p-4 text-left transition-all hover:border-foreground/40",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border"
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {subtitle}
        </p>
      )}
    </button>
  );
}
