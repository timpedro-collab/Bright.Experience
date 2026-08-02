"use client";

/**
 * Open one of a show's machines as sponsor inventory.
 *
 * Lives on the show rather than the portfolio page because a slot is a
 * machine plus a date range, and both come from the show in front of you.
 * Units already sold are still selectable — a machine can carry consecutive
 * sponsors across a multi-day show — but they're flagged so it's a decision
 * rather than an accident.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createShowSlot } from "@/app/actions/organizers";
import { missionLabel } from "@/lib/fleet-labels";
import type { MachineMission } from "@/types";

export interface SlotMachineOption {
  id: string;
  label: string;
  zone: string | null;
  mission: MachineMission | null;
  /** How many slots already exist on this unit. */
  slotCount: number;
}

interface NewShowSlotFormProps {
  eventId: string;
  machines: SlotMachineOption[];
  /** Show dates, pre-filled so the common case is two clicks. */
  defaultStartDate: string;
  defaultEndDate: string;
}

export function NewShowSlotForm({
  eventId,
  machines,
  defaultStartDate,
  defaultEndDate,
}: NewShowSlotFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [machineId, setMachineId] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [price, setPrice] = useState("");

  function reset() {
    setMachineId("");
    setSponsorName("");
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setPrice("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) {
      toast.error("Pick which machine you're selling.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("The end date can't fall before the start date.");
      return;
    }

    startTransition(async () => {
      const result = await createShowSlot({
        eventId,
        machineInstanceId: machineId,
        sponsorName: sponsorName.trim() || undefined,
        startDate,
        endDate,
        price: price ? Number(price) : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        sponsorName.trim()
          ? `${sponsorName.trim()} added to the show`
          : "Slot opened for sale"
      );
      reset();
      router.refresh();
    });
  }

  if (machines.length === 0) return null;

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Open a slot
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-heading text-sm font-semibold text-foreground">
          Open a slot
        </p>
        <Button variant="ghost" size="sm" onClick={reset} type="button">
          <X size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="slot-machine">Machine</Label>
          <NativeSelect
            id="slot-machine"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="">Which unit are you selling?</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.zone ? ` · ${m.zone}` : ""} · {missionLabel(m.mission)}
                {m.slotCount > 0 ? " · already has a slot" : ""}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-sponsor">Sponsor</Label>
          <Input
            id="slot-sponsor"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Leave blank to list it as open"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-price">Price (£)</Label>
          <Input
            id="slot-price"
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="18000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-start">Runs from</Label>
          <Input
            id="slot-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-end">Runs to</Label>
          <Input
            id="slot-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Open slot
        </Button>
        <p className="text-xs text-muted-foreground">
          You can add the sponsor and price later.
        </p>
      </div>
    </form>
  );
}
