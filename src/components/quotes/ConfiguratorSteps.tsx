/** Step content panels for the Track 1 configurator */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Addon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface MachineStepProps {
  machine: string;
  onChange: (v: string) => void;
}

/** Step 1: machine selection input. */
export function MachineStep({ machine, onChange }: MachineStepProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Select Machine</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="machine">Machine Type</Label>
        <Input id="machine" placeholder="e.g. Claw Machine" value={machine} onChange={(e) => onChange(e.target.value)} />
      </CardContent>
    </Card>
  );
}

interface GameStepProps {
  game: string;
  onChange: (v: string) => void;
}

/** Step 2: game selection input. */
export function GameStep({ game, onChange }: GameStepProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Choose Game</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="game">Game Software</Label>
        <Input id="game" placeholder="e.g. Spin to Win" value={game} onChange={(e) => onChange(e.target.value)} />
      </CardContent>
    </Card>
  );
}

interface AddonStepProps {
  addons: Addon[];
  selected: string[];
  onToggle: (id: string) => void;
}

/** Step 3: add-on checkbox list. */
export function AddonStep({ addons, selected, onToggle }: AddonStepProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Add-ons</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {addons.map((addon) => (
          <label key={addon.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/20">
            <Checkbox checked={selected.includes(addon.id)} onCheckedChange={() => onToggle(addon.id)} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{addon.name}</p>
              {addon.description && <p className="text-xs text-muted-foreground">{addon.description}</p>}
            </div>
            <span className="text-sm font-semibold text-foreground">£{(addon.price / 100).toFixed(2)}</span>
          </label>
        ))}
        {addons.length === 0 && (
          <p className="text-sm text-muted-foreground">No add-ons available for this package.</p>
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

/** Step 4: event date range inputs. */
export function DateStep({ dateStart, dateEnd, onChangeStart, onChangeEnd }: DateStepProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Event Dates</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateStart">Start Date</Label>
          <Input id="dateStart" type="date" value={dateStart} onChange={(e) => onChangeStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateEnd">End Date</Label>
          <Input id="dateEnd" type="date" value={dateEnd} onChange={(e) => onChangeEnd(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}
