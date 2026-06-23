/** Client board for creating, reserving, confirming, and managing ad slots. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Megaphone, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createSponsorshipSlot,
  reserveSlot,
  confirmSlot,
  completeSlot,
  releaseSlot,
  updateSlot,
  deleteSlot,
} from "@/app/actions/venues";
import { formatUSDFromCents } from "@/lib/currency";
import { formatDateShort, formatDateMedium } from "@/lib/dates";
import { venueStatusVariant, venueStatusLabel } from "@/components/venues/venue-helpers";

interface Slot {
  id: string;
  startDate: string;
  endDate: string;
  price?: number;
  status: string;
  sponsorId?: string;
  sponsorName?: string;
  campaign?: string;
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
}: {
  slot: Slot;
  sponsors: SponsorOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "reserve" | "edit">("view");
  const [sponsorId, setSponsorId] = useState(sponsors[0]?.id ?? "");
  const [campaign, setCampaign] = useState("");
  const [price, setPrice] = useState(
    slot.price != null ? String(slot.price / 100) : "",
  );
  const [startDate, setStartDate] = useState(slot.startDate);
  const [endDate, setEndDate] = useState(slot.endDate);

  function run(fn: () => Promise<{ success: boolean }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        setMode("view");
        router.refresh();
      }
    });
  }

  const advertiserLabel = slot.sponsorName ?? slot.campaign;

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

        {advertiserLabel && (
          <p className="text-xs text-muted-foreground">
            {slot.sponsorName ? "Sponsor" : "Advertiser"}:{" "}
            <span className="text-foreground">{advertiserLabel}</span>
          </p>
        )}

        {slot.campaign && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Megaphone size={11} />
            <span className="text-foreground">{slot.campaign}</span>
          </p>
        )}

        {/* ── Reserve flow (available → reserved) ── */}
        {mode === "reserve" && (
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
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Campaign (e.g. Summer Tech Week — register & win)"
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={isPending || !sponsorId}
                onClick={() => run(() => reserveSlot(slot.id, sponsorId, campaign))}
              >
                {isPending ? "Reserving…" : "Confirm hold"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode("view")}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Edit flow (price + dates) ── */}
        {mode === "edit" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
                className="h-8 text-xs"
              />
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
                className="h-8 text-xs"
              />
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              aria-label="Price"
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    updateSlot(slot.id, {
                      price: price.trim() === "" ? undefined : Number(price),
                      startDate,
                      endDate,
                    }),
                  )
                }
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode("view")}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Status-driven controls ── */}
        {mode === "view" && (
          <div className="space-y-2">
            {slot.status === "available" && (
              <>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={sponsors.length === 0}
                  onClick={() => setMode("reserve")}
                >
                  Reserve slot
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 gap-1.5"
                    onClick={() => setMode("edit")}
                  >
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => run(() => deleteSlot(slot.id))}
                  >
                    <Trash2 size={12} /> Delete
                  </Button>
                </div>
              </>
            )}

            {slot.status === "reserved" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => run(() => confirmSlot(slot.id))}
                >
                  {isPending ? "…" : "Confirm booking"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => releaseSlot(slot.id))}
                >
                  Release
                </Button>
              </div>
            )}

            {slot.status === "active" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => run(() => completeSlot(slot.id))}
                >
                  {isPending ? "…" : "Mark completed"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => run(() => releaseSlot(slot.id))}
                >
                  Release
                </Button>
              </div>
            )}
          </div>
        )}
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
