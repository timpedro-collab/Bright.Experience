/**
 * One of an organizer's shows, with the hardware standing at it.
 *
 * This is the screen that used to be a hand-written database row: what's
 * deployed, what each unit is doing, and the two ways to add another — an
 * existing free unit, or a serial that has just come off the van.
 */
import Link from "next/link";
import { Cpu, ExternalLink, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AssignMachineForm } from "./AssignMachineForm";
import { RegisterMachineForm, type MachineTypeOption } from "./RegisterMachineForm";
import { ReleaseMachineButton } from "./ReleaseMachineButton";
import { UnlinkShowButton } from "./UnlinkShowButton";

import { formatDateShort } from "@/lib/dates";
import { missionLabel } from "@/lib/fleet-labels";
import { STAGE_CONFIG, type Stage, type MachineMission } from "@/types";
import type { AssignableMachine, SetupShow } from "@/lib/queries/organizer-admin";

interface ShowSetupCardProps {
  show: SetupShow;
  organizerSlug: string;
  assignableMachines: AssignableMachine[];
  machineTypes: MachineTypeOption[];
}

export function ShowSetupCard({
  show,
  organizerSlug,
  assignableMachines,
  machineTypes,
}: ShowSetupCardProps) {
  const stageLabel =
    STAGE_CONFIG[show.currentStage as Stage]?.shortLabel ?? show.currentStage.replace(/_/g, " ");
  const needsSetup = show.machines.filter((m) => !m.zone || !m.mission).length;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-heading text-sm font-semibold text-foreground">{show.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateShort(show.eventDateStart)}
              {show.eventDateEnd ? ` – ${formatDateShort(show.eventDateEnd)}` : ""}
              {show.venueName ? ` · ${show.venueName}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[0.65rem]">
              {stageLabel}
            </Badge>
            <Link
              href={`/organizers/${organizerSlug}/shows/${show.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
            >
              Their view <ExternalLink size={11} />
            </Link>
            <UnlinkShowButton eventId={show.id} showName={show.name} />
          </div>
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Cpu size={11} />
              Fleet · {show.machines.length}
            </p>
            {needsSetup > 0 && (
              <p className="text-xs text-warning">
                {needsSetup} unit{needsSetup === 1 ? "" : "s"} without a zone or job
              </p>
            )}
          </div>

          {show.machines.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing deployed yet. The organizer&apos;s fleet board will be empty until you add
              a unit.
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {show.machines.map((machine) => (
                <li
                  key={machine.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {machine.serialNumber}
                      {machine.nickname ? (
                        <span className="text-muted-foreground"> · {machine.nickname}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.65rem] text-muted-foreground">
                      {machine.machineTypeName ?? "Unknown type"}
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={9} />
                        {machine.zone ?? "No zone"}
                      </span>
                      <span>{missionLabel(machine.mission as MachineMission | null)}</span>
                      {machine.sponsorName ? <span>· {machine.sponsorName}</span> : null}
                    </p>
                  </div>
                  <ReleaseMachineButton
                    machineInstanceId={machine.id}
                    serialNumber={machine.serialNumber}
                    blocked={machine.hasSlot}
                    blockedBySponsor={machine.sponsorName}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3">
            <AssignMachineForm eventId={show.id} machines={assignableMachines} />
            <RegisterMachineForm eventId={show.id} machineTypes={machineTypes} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
