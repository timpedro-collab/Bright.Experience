/** Card for a single sponsorship slot with reserve/edit/status actions. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Megaphone, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  reserveSlot,
  confirmSlot,
  completeSlot,
  releaseSlot,
  updateSlot,
  deleteSlot,
} from "@/app/actions/venues";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import { venueStatusVariant, venueStatusLabel } from "@/components/venues/venue-helpers";
import type { Slot, SponsorOption } from "./sponsorship-types";

const formatDate = formatDateShort;

export function SlotCard({
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
              {formatMoneyFromPence(slot.price)}
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
