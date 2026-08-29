"use client";

/**
 * Scope switcher for a show running more than one machine.
 *
 * A show holds one show-wide default configuration plus an optional override
 * per machine. This picks the scope being edited and hands the matching row
 * to {@link GameConfigForm}. Machines with no override prefill from the
 * default so authoring a variation starts from what the show already does.
 */

import { useState } from "react";
import { Layers, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GameConfigForm } from "@/components/configuration/GameConfigForm";
import {
  findDefaultConfig,
  groupMachinesByZone,
  type FleetMachine,
} from "@/lib/configuration/resolve-config";
import { MISSION_LABELS } from "@/lib/fleet-labels";
import type { GameConfiguration } from "@/app/actions/game-config";
import type { UserRole } from "@/types";

interface FleetConfigTabsProps {
  eventId: string;
  fleet: FleetMachine[];
  configs: GameConfiguration[];
  viewerRole: UserRole;
}

const SHOW_SCOPE = "__show__";

export function FleetConfigTabs({
  eventId,
  fleet,
  configs,
  viewerRole,
}: FleetConfigTabsProps) {
  const [scope, setScope] = useState<string>(SHOW_SCOPE);

  const showDefault = findDefaultConfig(configs);
  const overrideCount = configs.filter((c) => c.machineInstanceId !== null).length;
  const selectedMachine = fleet.find((m) => m.id === scope) ?? null;
  const override = selectedMachine
    ? configs.find((c) => c.machineInstanceId === selectedMachine.id) ?? null
    : null;

  // An inheriting machine prefills from the default so the author edits a
  // copy of what the show already runs rather than an empty form.
  const activeConfig = selectedMachine ? override ?? showDefault : showDefault;
  const machineLabel = selectedMachine
    ? selectedMachine.nickname || selectedMachine.serialNumber
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setScope(SHOW_SCOPE)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            scope === SHOW_SCOPE
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/40 hover:bg-accent"
          )}
        >
          <Layers size={14} className="text-muted-foreground" />
          <span className="font-medium text-foreground">Show default</span>
          <span className="text-xs text-muted-foreground">
            {fleet.length - overrideCount} of {fleet.length} machines
          </span>
        </button>

        {groupMachinesByZone(fleet).map((group) =>
          group.machines.map((machine) => {
            const hasOwn = configs.some((c) => c.machineInstanceId === machine.id);
            return (
              <button
                key={machine.id}
                type="button"
                onClick={() => setScope(machine.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  scope === machine.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/40 hover:bg-accent"
                )}
              >
                <MapPin size={14} className="text-muted-foreground" />
                <span className="text-left">
                  <span className="block font-medium text-foreground">
                    {machine.nickname || machine.serialNumber}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {group.zone}
                    {machine.mission ? ` · ${MISSION_LABELS[machine.mission]}` : ""}
                  </span>
                </span>
                {hasOwn && (
                  <Badge className="ml-1 border-primary/30 bg-primary/15 text-[10px] text-foreground">
                    Custom
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Remount on scope change so the form state reloads from the new row. */}
      <GameConfigForm
        key={scope}
        eventId={eventId}
        config={activeConfig}
        viewerRole={viewerRole}
        machineInstanceId={selectedMachine?.id ?? null}
        machineLabel={machineLabel}
        isOverride={selectedMachine ? Boolean(override) : true}
      />
    </div>
  );
}
