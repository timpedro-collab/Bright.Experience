/** Form to create a new sponsorship slot on a placement. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSponsorshipSlot } from "@/app/actions/venues";

export function AddSlotForm({
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
