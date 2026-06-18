"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveVenueAccess, type VenueAccess } from "@/app/actions/logistics";

interface VenueAccessCardProps {
  eventId: string;
  access: VenueAccess | null;
  /** Customers fill this in; internal staff see it read-only. */
  canEdit: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

const EMPTY: VenueAccess = { hall: "", stand: "", loadingZone: "", notes: "" };

export function VenueAccessCard({ eventId, access, canEdit }: VenueAccessCardProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [hall, setHall] = useState(access?.hall ?? "");
  const [stand, setStand] = useState(access?.stand ?? "");
  const [loadingZone, setLoadingZone] = useState(access?.loadingZone ?? "");
  const [notes, setNotes] = useState(access?.notes ?? "");

  const hasAccess = Boolean(
    access && (access.hall || access.stand || access.loadingZone || access.notes)
  );

  function handleSave() {
    startSave(async () => {
      const result = await saveVenueAccess(eventId, {
        hall,
        stand,
        loadingZone,
        notes,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Venue access saved", {
        description: "Our crew will head straight to the right spot.",
      });
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <Card tone="subtle" className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Venue access</h3>
          {hasAccess && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Provided
            </span>
          )}
        </div>
        {hasAccess ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {access!.hall && (
              <div>
                <p className="text-overline text-muted-foreground">Hall</p>
                <p className="text-foreground">{access!.hall}</p>
              </div>
            )}
            {access!.stand && (
              <div>
                <p className="text-overline text-muted-foreground">Stand</p>
                <p className="text-foreground">{access!.stand}</p>
              </div>
            )}
            {access!.loadingZone && (
              <div>
                <p className="text-overline text-muted-foreground">Loading zone</p>
                <p className="text-foreground">{access!.loadingZone}</p>
              </div>
            )}
            {access!.notes && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-overline text-muted-foreground">Notes</p>
                <p className="text-foreground">{access!.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No venue access details shared yet.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Venue access</h3>
          {hasAccess && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Where exactly are we headed? Fill in whatever applies — leave the rest
          blank.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Hall
          </label>
          <input
            value={hall}
            onChange={(e) => setHall(e.target.value)}
            placeholder="e.g. Hall 3"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Stand number
          </label>
          <input
            value={stand}
            onChange={(e) => setStand(e.target.value)}
            placeholder="e.g. C42"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Loading zone / dock
          </label>
          <input
            value={loadingZone}
            onChange={(e) => setLoadingZone(e.target.value)}
            placeholder="e.g. North loading bay"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Access notes <span className="font-normal">(optional)</span>
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Height limits, security passes, one-way systems, marshalls…"
          className={inputClass}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : hasAccess ? "Update access" : "Save access"}
        </Button>
      </div>
    </Card>
  );
}
