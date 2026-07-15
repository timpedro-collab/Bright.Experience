/** Client board for creating, reserving, confirming, and managing ad slots. */
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateMedium } from "@/lib/dates";
import { SlotCard } from "./SlotCard";
import { AddSlotForm } from "./AddSlotForm";
import type { PlacementWithSlots, SponsorOption } from "./sponsorship-types";

export type { PlacementWithSlots, SponsorOption, Slot } from "./sponsorship-types";

export function VenueSponsorshipBoard({
  placements,
  sponsors,
}: {
  placements: PlacementWithSlots[];
  sponsors: SponsorOption[];
}) {
  const [addingFor, setAddingFor] = useState<string | null>(null);

  if (placements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No active placements with sponsorship slots.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {placements.map((placement) => (
        <Card key={placement.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold">
                {placement.machineName ?? "Machine Placement"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  {formatDateMedium(placement.startDate)}
                  {placement.endDate &&
                    ` — ${formatDateMedium(placement.endDate)}`}
                </Badge>
                {addingFor !== placement.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setAddingFor(placement.id)}
                  >
                    <Plus size={14} />
                    Add slot
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {addingFor === placement.id && (
              <AddSlotForm
                placementId={placement.id}
                onDone={() => setAddingFor(null)}
              />
            )}
            {placement.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sponsorship slots configured for this placement.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {placement.slots.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} sponsors={sponsors} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
