"use client";

/**
 * Register a physical unit and deploy it to this show in one step.
 *
 * Setting up a show is when we find out which serials are actually going, so
 * the register-and-deploy pair belongs on the show rather than in a separate
 * hardware screen an admin would have to bounce to and back.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createMachineInstance } from "@/app/actions/organizer-admin";

export interface MachineTypeOption {
  id: string;
  name: string;
}

interface RegisterMachineFormProps {
  eventId: string;
  machineTypes: MachineTypeOption[];
}

export function RegisterMachineForm({ eventId, machineTypes }: RegisterMachineFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [machineTypeId, setMachineTypeId] = useState(machineTypes[0]?.id ?? "");
  const [serialNumber, setSerialNumber] = useState("");
  const [nickname, setNickname] = useState("");

  function reset() {
    setSerialNumber("");
    setNickname("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineTypeId) {
      toast.error("Choose which machine this is.");
      return;
    }
    if (!serialNumber.trim()) {
      toast.error("Enter the serial number on the unit.");
      return;
    }

    startTransition(async () => {
      const result = await createMachineInstance({
        machineTypeId,
        serialNumber: serialNumber.trim(),
        nickname: nickname.trim() || undefined,
        eventId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.serialNumber} registered and deployed`);
      reset();
      router.refresh();
    });
  }

  if (machineTypes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Add a machine to the catalogue before registering physical units.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Register a new machine
      </Button>
    );
  }

  const idFor = (field: string) => `register-${field}-${eventId}`;

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border/70 bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          New machine
        </p>
        <Button variant="ghost" size="sm" type="button" onClick={reset} aria-label="Cancel">
          <X size={13} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={idFor("serial")}>Serial number</Label>
          <Input
            id={idFor("serial")}
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="BV-2010"
            maxLength={60}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={idFor("type")}>Machine</Label>
          <NativeSelect
            id={idFor("type")}
            value={machineTypeId}
            onChange={(e) => setMachineTypeId(e.target.value)}
          >
            {machineTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor={idFor("nickname")}>Nickname</Label>
          <Input
            id={idFor("nickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Optional"
            maxLength={120}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Register and deploy
        </Button>
      </div>
    </form>
  );
}
