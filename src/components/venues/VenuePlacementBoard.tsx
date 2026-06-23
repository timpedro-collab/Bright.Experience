/** Client board for creating placements and advancing their status. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createPlacement, updatePlacementStatus } from "@/app/actions/venues";
import { venueStatusVariant, venueStatusLabel } from "@/components/venues/venue-helpers";

export interface PlacementRow {
  id: string;
  machineName?: string;
  startDate: string;
  endDate?: string;
  status: string;
  notes?: string;
}

const STATUS_OPTIONS = ["planned", "active", "completed", "cancelled"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US");
}

export function VenuePlacementBoard({
  venueId,
  placements,
}: {
  venueId: string;
  placements: PlacementRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setShowForm(false);
    setStartDate("");
    setEndDate("");
    setError(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPlacement({
        venueId,
        startDate,
        endDate: endDate || undefined,
      });
      if (result.success) {
        resetForm();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const result = await updatePlacementStatus(id, status);
      if (result.success) router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">All Placements</CardTitle>
        {!showForm && (
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            New placement
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-lg border border-border/60 p-4 space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="placement-start">Start date</Label>
                <Input
                  id="placement-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="placement-end">End date (optional)</Label>
                <Input
                  id="placement-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !startDate}
              >
                {isPending ? "Creating…" : "Create placement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {placements.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No placements created yet. Click &ldquo;New placement&rdquo; to get
            started.
          </p>
        ) : (
          <div className="space-y-3">
            {placements.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {p.machineName ?? "Awaiting machine"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.startDate)}
                    {p.endDate && ` — ${formatDate(p.endDate)}`}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground">{p.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={venueStatusVariant(p.status)}>
                    {venueStatusLabel(p.status)}
                  </Badge>
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    disabled={isPending}
                    aria-label="Placement status"
                    className="rounded-md border border-border/40 bg-transparent px-2 py-1 text-xs outline-none focus:border-[var(--color-bb-cobalt)]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-background">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
