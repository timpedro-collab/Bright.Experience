"use client";

/**
 * Move a sold slot onto a different unit at the same show.
 *
 * Needed more often than it sounds: a sponsor asks for the busier hall, or a
 * unit goes into maintenance and the slot has to follow the sponsor's money
 * to a working machine.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/ui/native-select";
import { assignSlotMachine } from "@/app/actions/organizers";
import { missionLabel } from "@/lib/fleet-labels";
import type { MachineMission } from "@/types";

export interface SlotMachineChoice {
  id: string;
  label: string;
  zone: string | null;
  mission: MachineMission | null;
}

interface SlotMachineSelectProps {
  slotId: string;
  currentMachineId: string | null;
  machines: SlotMachineChoice[];
}

export function SlotMachineSelect({
  slotId,
  currentMachineId,
  machines,
}: SlotMachineSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(machineInstanceId: string) {
    if (!machineInstanceId || machineInstanceId === currentMachineId) return;
    startTransition(async () => {
      const result = await assignSlotMachine(slotId, machineInstanceId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Slot moved");
      router.refresh();
    });
  }

  if (machines.length < 2) return null;

  return (
    <div className="flex items-center gap-2">
      <NativeSelect
        aria-label="Machine running this slot"
        className="h-8 text-xs"
        value={currentMachineId ?? ""}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">No machine assigned</option>
        {machines.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
            {m.zone ? ` · ${m.zone}` : ""} · {missionLabel(m.mission)}
          </option>
        ))}
      </NativeSelect>
      {pending && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
    </div>
  );
}
