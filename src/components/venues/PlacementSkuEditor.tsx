/** Collapsible editor for placement SKU details and publish state. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  publishPlacementSku,
  updatePlacementSku,
} from "@/app/actions/venues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PlacementSkuEditorProps {
  placementId: string;
  skuCode: string | null;
  locationLabel: string | null;
  footfallEstimate: number | null;
  maxSlotsPerSponsor: number | null;
  skuStatus: "draft" | "live";
}

function optionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function PlacementSkuEditor({
  placementId,
  skuCode,
  locationLabel,
  footfallEstimate,
  maxSlotsPerSponsor,
  skuStatus,
}: PlacementSkuEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [savePending, startSaveTransition] = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const [skuCodeInput, setSkuCodeInput] = useState(skuCode ?? "");
  const [locationInput, setLocationInput] = useState(locationLabel ?? "");
  const [footfallInput, setFootfallInput] = useState(
    footfallEstimate != null ? String(footfallEstimate) : "",
  );
  const [maxSlotsInput, setMaxSlotsInput] = useState(
    maxSlotsPerSponsor != null ? String(maxSlotsPerSponsor) : "",
  );

  function openForm() {
    setSkuCodeInput(skuCode ?? "");
    setLocationInput(locationLabel ?? "");
    setFootfallInput(
      footfallEstimate != null ? String(footfallEstimate) : "",
    );
    setMaxSlotsInput(
      maxSlotsPerSponsor != null ? String(maxSlotsPerSponsor) : "",
    );
    setOpen(true);
  }

  function collapse() {
    setOpen(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    startSaveTransition(async () => {
      const payload: Parameters<typeof updatePlacementSku>[0] = { placementId };
      const nextSkuCode = optionalString(skuCodeInput);
      const nextLocation = optionalString(locationInput);
      const nextFootfall = optionalNumber(footfallInput);
      const nextMaxSlots = optionalNumber(maxSlotsInput);
      if (nextSkuCode !== undefined) payload.skuCode = nextSkuCode;
      if (nextLocation !== undefined) payload.locationLabel = nextLocation;
      if (nextFootfall !== undefined) payload.footfallEstimate = nextFootfall;
      if (nextMaxSlots !== undefined) payload.maxSlotsPerSponsor = nextMaxSlots;

      const result = await updatePlacementSku(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("SKU details saved");
      collapse();
      router.refresh();
    });
  }

  function handlePublish(live: boolean) {
    startPublishTransition(async () => {
      const result = await publishPlacementSku(placementId, live);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(live ? "Placement published" : "Placement unpublished");
      router.refresh();
    });
  }

  const publishControl =
    skuStatus === "draft" ? (
      <Button
        variant="brand"
        size="sm"
        type="button"
        disabled={publishPending}
        onClick={() => handlePublish(true)}
      >
        {publishPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : null}
        Publish to advertise page
      </Button>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Live on your advertise page
        </p>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={publishPending}
          onClick={() => handlePublish(false)}
        >
          {publishPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          Unpublish
        </Button>
      </div>
    );

  if (!open) {
    return (
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={openForm}>
          Edit SKU details
        </Button>
        {publishControl}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSave}
        className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-heading text-sm font-semibold text-foreground">
            SKU details
          </p>
          <Button variant="ghost" size="sm" onClick={collapse} type="button">
            <X size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`sku-code-${placementId}`}>SKU code</Label>
            <Input
              id={`sku-code-${placementId}`}
              value={skuCodeInput}
              onChange={(e) => setSkuCodeInput(e.target.value)}
              placeholder="WES-ST-01"
              maxLength={24}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`sku-location-${placementId}`}>Location</Label>
            <Input
              id={`sku-location-${placementId}`}
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="The Street, ground floor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`sku-footfall-${placementId}`}>
              Daily footfall (estimate)
            </Label>
            <Input
              id={`sku-footfall-${placementId}`}
              type="number"
              min={0}
              value={footfallInput}
              onChange={(e) => setFootfallInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`sku-max-slots-${placementId}`}>
              Max slots per sponsor
            </Label>
            <Input
              id={`sku-max-slots-${placementId}`}
              type="number"
              min={1}
              max={20}
              value={maxSlotsInput}
              onChange={(e) => setMaxSlotsInput(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          <Button variant="brand" size="sm" type="submit" disabled={savePending}>
            {savePending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            Save SKU details
          </Button>
        </div>
      </form>

      {publishControl}
    </div>
  );
}
