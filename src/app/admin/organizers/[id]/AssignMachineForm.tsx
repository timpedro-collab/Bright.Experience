"use client";

/**
 * Stand an already-registered unit at this show.
 *
 * The list is units sitting free — a machine at another show has to be
 * released there first, so setting up one show can't quietly break another.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { assignMachineToShow } from "@/app/actions/organizer-admin";
import type { AssignableMachine } from "@/lib/queries/organizer-admin";

interface AssignMachineFormProps {
  eventId: string;
  machines: AssignableMachine[];
}

export function AssignMachineForm({ eventId, machines }: AssignMachineFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [machineId, setMachineId] = useState("");

  if (machines.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No free machines in the register. Add one below.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) {
      toast.error("Pick a machine to deploy.");
      return;
    }

    startTransition(async () => {
      const result = await assignMachineToShow(machineId, eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Machine deployed to this show");
      setMachineId("");
      router.refresh();
    });
  }

  const selectId = `assign-machine-${eventId}`;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor={selectId}>Free machines</Label>
        <NativeSelect
          id={selectId}
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
        >
          <option value="">Choose a machine</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.serialNumber}
              {machine.nickname ? ` · ${machine.nickname}` : ""}
              {machine.machineTypeName ? ` · ${machine.machineTypeName}` : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-end">
        <Button variant="outline" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
          Deploy here
        </Button>
      </div>
    </form>
  );
}
