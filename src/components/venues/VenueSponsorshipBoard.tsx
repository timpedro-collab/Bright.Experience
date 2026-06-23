/** Client board for creating sponsorship slots and reserving them for sponsors. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createSponsorshipSlot, reserveSlot } from "@/app/actions/venues";
import { formatUSDFromCents } from "@/lib/currency";
import { formatDateShort, formatDateMedium } from "@/lib/dates";
import { venueStatusVariant, venueStatusLabel } from "@/components/venues/venue-helpers";

interface Slot {
  id: string;
  startDate: string;
  endDate: string;
  price?: number;
  status: string;
  sponsorName?: string;
}

export interface PlacementWithSlots {
  id: string;
  startDate: string;
  endDate?: string;
  machineName?: string;
  slots: Slot[];
}

export interface SponsorOption {
  id: string;
  name: string;
}

const formatDate = formatDateShort;

function SlotCard({
  slot,
  sponsors,
  onReserve,
  isPending,
}: {
  slot: Slot;
  sponsors: SponsorOption[];
  onReserve: (slotId: string, sponsorId: string) => void;
  isPending: boolean;
}) {
  const [reserving, setReserving] = useState(false);
  const [sponsorId, setSponsorId] = useState(sponsors[0]?.id ?? "");

  return (
    <Card interactive>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Badge variant={venueStatusVariant(slot.status)}>
            {venueStatusLabel(slot.status)}
          </Badge>
          {slot.price != null && (
            <span className="text-sm font-semibold text-brand">
              {formatUSDFromCents(slot.price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>
            {formatDate(slot.startDate)} — {formatDate(slot.endDate)}
          </span>
        </div>

        {slot.sponsorName && (
          <p className="text-xs text-muted-foreground">
            Sponsor: <span className="text-foreground">{slot.sponsorName}</span>
          </p>
        )}

        {slot.status === "available" &&
          (reserving ? (
            <div className="space-y-2">
              <select
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                aria-label="Sponsor"
                className="w-full rounded-md border border-border/40 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-[var(--color-bb-cobalt)]"
              >
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id} className="bg-background">
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={isPending || !sponsorId}
                  onClick={() => onReserve(slot.id, sponsorId)}
                >
                  {isPending ? "Reserving…" : "Confirm"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReserving(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              disabled={sponsors.length === 0}
              onClick={() => setReserving(true)}
            >
              Reserve Slot
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

function AddSlotForm({
  placementId,
  onDone,
}: {
  placementId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedPrice = price.trim() === "" ? undefined : Number(price);
    startTransition(async () => {
      const result = await createSponsorshipSlot({
        placementId,
        startDate,
        endDate,
        price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      });
      if (result.success) {
        onDone();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/60 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`slot-start-${placementId}`}>Start</Label>
          <Input
            id={`slot-start-${placementId}`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slot-end-${placementId}`}>End</Label>
          <Input
            id={`slot-end-${placementId}`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slot-price-${placementId}`}>Price ($)</Label>
          <Input
            id={`slot-price-${placementId}`}
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !startDate || !endDate}
        >
          {isPending ? "Adding…" : "Add slot"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function VenueSponsorshipBoard({
  placements,
  sponsors,
}: {
  placements: PlacementWithSlots[];
  sponsors: SponsorOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingFor, setAddingFor] = useState<string | null>(null);

  function handleReserve(slotId: string, sponsorId: string) {
    startTransition(async () => {
      const result = await reserveSlot(slotId, sponsorId);
      if (result.success) router.refresh();
    });
  }

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
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    sponsors={sponsors}
                    onReserve={handleReserve}
                    isPending={isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
