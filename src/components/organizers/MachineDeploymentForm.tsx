"use client";

/**
 * Where a unit stands and what it's there to do.
 *
 * The two fields an organizer owns on a machine. Zone is free text because
 * organizers name their own halls; mission is a fixed list because the
 * machine stack branches on it, and each option carries its explanation so
 * nobody has to guess what "rebook reward" means.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { updateMachineDeployment } from "@/app/actions/organizers";
import { MISSION_LABELS, MISSION_DESCRIPTIONS } from "@/lib/fleet-labels";
import type { MachineMission } from "@/types";

const MISSIONS = Object.keys(MISSION_LABELS) as MachineMission[];

/** Sentinel for "no mission chosen", kept distinct from a real value. */
const UNASSIGNED = "__unassigned__";

interface MachineDeploymentFormProps {
  machineInstanceId: string;
  zone: string | null;
  mission: MachineMission | null;
  /** Zones already in use at this show, offered as quick picks. */
  knownZones?: string[];
}

export function MachineDeploymentForm({
  machineInstanceId,
  zone,
  mission,
  knownZones = [],
}: MachineDeploymentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [zoneValue, setZoneValue] = useState(zone ?? "");
  const [missionValue, setMissionValue] = useState<string>(mission ?? UNASSIGNED);

  const dirty =
    zoneValue.trim() !== (zone ?? "") ||
    (missionValue === UNASSIGNED ? null : missionValue) !== mission;

  const otherZones = knownZones.filter(
    (z) => z.toLowerCase() !== zoneValue.trim().toLowerCase()
  );

  function handleSave() {
    startTransition(async () => {
      const result = await updateMachineDeployment(machineInstanceId, {
        zone: zoneValue,
        mission: missionValue === UNASSIGNED ? null : (missionValue as MachineMission),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Deployment updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="machine-zone">Zone</Label>
        <Input
          id="machine-zone"
          value={zoneValue}
          onChange={(e) => setZoneValue(e.target.value)}
          placeholder="Registration North"
          maxLength={120}
        />
        {otherZones.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <MapPin size={11} className="text-muted-foreground" />
            {otherZones.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoneValue(z)}
                className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:border-[var(--color-bb-cobalt)]/40 hover:text-foreground"
              >
                {z}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="machine-mission">Mission</Label>
        <NativeSelect
          id="machine-mission"
          value={missionValue}
          onChange={(e) => setMissionValue(e.target.value)}
        >
          <option value={UNASSIGNED}>Not set yet</option>
          {MISSIONS.map((m) => (
            <option key={m} value={m}>
              {MISSION_LABELS[m]}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          {missionValue === UNASSIGNED
            ? "Until this is set the unit runs the show-wide default."
            : MISSION_DESCRIPTIONS[missionValue as MachineMission]}
        </p>
      </div>

      <Button
        variant="brand"
        size="sm"
        onClick={handleSave}
        disabled={pending || !dirty}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {dirty ? "Save deployment" : "Saved"}
      </Button>
    </div>
  );
}
