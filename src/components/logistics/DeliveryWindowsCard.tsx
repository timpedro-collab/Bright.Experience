"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck, ArrowDownToLine, Save, Loader2, CheckCircle2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  saveDeliveryWindows,
  type DeliveryWindow,
  type DeliveryWindows,
} from "@/app/actions/logistics";

interface DeliveryWindowsCardProps {
  eventId: string;
  windows: DeliveryWindows;
  /** Customers set their preferences; internal staff see them read-only. */
  canEdit: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

const TIME_WINDOWS = [
  "No preference",
  "Morning (8am–12pm)",
  "Midday (11am–2pm)",
  "Afternoon (12–5pm)",
  "Evening (5–9pm)",
];

const EMPTY: DeliveryWindow = { date: "", window: "", notes: "" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function WindowFields({
  label,
  Icon,
  value,
  onChange,
}: {
  label: string;
  Icon: React.ElementType;
  value: DeliveryWindow;
  onChange: (next: DeliveryWindow) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Preferred date
          </label>
          <input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Time window
          </label>
          <select
            value={value.window || TIME_WINDOWS[0]}
            onChange={(e) =>
              onChange({
                ...value,
                window: e.target.value === TIME_WINDOWS[0] ? "" : e.target.value,
              })
            }
            className={inputClass}
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Notes <span className="font-normal">(optional)</span>
        </label>
        <input
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Access restrictions, loading bay, flexible dates…"
          className={inputClass}
        />
      </div>
    </div>
  );
}

function WindowReadout({
  label,
  Icon,
  value,
}: {
  label: string;
  Icon: React.ElementType;
  value: DeliveryWindow | null;
}) {
  const has = value && (value.date || value.window || value.notes);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      </div>
      {has ? (
        <div className="space-y-1 text-sm">
          {value!.date && (
            <p className="text-foreground">{formatDate(value!.date)}</p>
          )}
          {value!.window && (
            <p className="text-muted-foreground">{value!.window}</p>
          )}
          {value!.notes && (
            <p className="text-muted-foreground">{value!.notes}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No preference shared yet.</p>
      )}
    </div>
  );
}

export function DeliveryWindowsCard({
  eventId,
  windows,
  canEdit,
}: DeliveryWindowsCardProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [delivery, setDelivery] = useState<DeliveryWindow>(
    windows.delivery ?? EMPTY
  );
  const [pickup, setPickup] = useState<DeliveryWindow>(windows.pickup ?? EMPTY);

  const hasAny = Boolean(windows.delivery || windows.pickup);

  function handleSave() {
    startSave(async () => {
      const result = await saveDeliveryWindows(eventId, { delivery, pickup });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Preferred windows saved", {
        description: "Our logistics team will work to these where they can.",
      });
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <Card tone="subtle" className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Preferred delivery &amp; pickup windows
          </h3>
          {hasAny && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Shared by customer
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <WindowReadout label="Delivery" Icon={Truck} value={windows.delivery} />
          <WindowReadout
            label="Pickup"
            Icon={ArrowDownToLine}
            value={windows.pickup}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Preferred delivery &amp; pickup windows
          </h3>
          {hasAny && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          When would you like the kit delivered and collected? We&apos;ll work to
          these windows wherever the venue allows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WindowFields
          label="Delivery"
          Icon={Truck}
          value={delivery}
          onChange={setDelivery}
        />
        <WindowFields
          label="Pickup"
          Icon={ArrowDownToLine}
          value={pickup}
          onChange={setPickup}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : hasAny ? "Update windows" : "Save windows"}
        </Button>
      </div>
    </Card>
  );
}
