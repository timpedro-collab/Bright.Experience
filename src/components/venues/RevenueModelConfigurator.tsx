/** Collapsible form to set or change a placement's revenue model. */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updatePlacementPricing } from "@/app/actions/venues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  REVENUE_MODEL_LABELS,
  formatRevenueModel,
  venueShareForBooked,
  type RevenueModel,
} from "@/lib/venues/revenue-model";

export interface RevenueModelConfiguratorProps {
  placementId: string;
  current: RevenueModel | null;
  sampleBookedPence?: number;
}

type ModelKind = RevenueModel["model"];

function formStateFromModel(current: RevenueModel | null) {
  if (!current) {
    return {
      modelKind: "revenue_share" as ModelKind,
      sharePercent: "",
      flatFeePounds: "",
      guaranteePounds: "",
      overagePercent: "",
    };
  }
  switch (current.model) {
    case "revenue_share":
      return {
        modelKind: current.model,
        sharePercent: String(Math.round(current.rate * 100)),
        flatFeePounds: "",
        guaranteePounds: "",
        overagePercent: "",
      };
    case "fixed_fee":
      return {
        modelKind: current.model,
        sharePercent: "",
        flatFeePounds: String(Math.round(current.feePence / 100)),
        guaranteePounds: "",
        overagePercent: "",
      };
    case "guarantee_overage":
      return {
        modelKind: current.model,
        sharePercent: "",
        flatFeePounds: "",
        guaranteePounds: String(Math.round(current.guaranteePence / 100)),
        overagePercent: String(Math.round(current.overageRate * 100)),
      };
  }
}

function parsePercent(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parsePounds(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function buildModel(
  modelKind: ModelKind,
  sharePercent: string,
  flatFeePounds: string,
  guaranteePounds: string,
  overagePercent: string,
): RevenueModel | null {
  switch (modelKind) {
    case "revenue_share": {
      const percent = parsePercent(sharePercent);
      if (percent === null || percent < 1 || percent > 100) return null;
      return { model: "revenue_share", rate: percent / 100 };
    }
    case "fixed_fee": {
      const pounds = parsePounds(flatFeePounds);
      if (pounds === null || pounds < 0) return null;
      return { model: "fixed_fee", feePence: Math.round(pounds * 100) };
    }
    case "guarantee_overage": {
      const guarantee = parsePounds(guaranteePounds);
      const overage = parsePercent(overagePercent);
      if (
        guarantee === null ||
        guarantee < 0 ||
        overage === null ||
        overage < 1 ||
        overage > 100
      ) {
        return null;
      }
      return {
        model: "guarantee_overage",
        guaranteePence: Math.round(guarantee * 100),
        overageRate: overage / 100,
      };
    }
  }
}

function validateBeforeSave(
  modelKind: ModelKind,
  sharePercent: string,
  flatFeePounds: string,
  guaranteePounds: string,
  overagePercent: string,
): string | null {
  switch (modelKind) {
    case "revenue_share": {
      const percent = parsePercent(sharePercent);
      if (percent === null) return "Enter your share percentage.";
      if (percent < 1 || percent > 100) {
        return "Share must be between 1% and 100%.";
      }
      return null;
    }
    case "fixed_fee": {
      const pounds = parsePounds(flatFeePounds);
      if (pounds === null) return "Enter a flat fee.";
      if (pounds < 0) return "Flat fee cannot be negative.";
      return null;
    }
    case "guarantee_overage": {
      const guarantee = parsePounds(guaranteePounds);
      const overage = parsePercent(overagePercent);
      if (guarantee === null) return "Enter a guarantee amount.";
      if (guarantee < 0) return "Guarantee cannot be negative.";
      if (overage === null) return "Enter the share above the guarantee.";
      if (overage < 1 || overage > 100) {
        return "Share above the guarantee must be between 1% and 100%.";
      }
      return null;
    }
  }
}

export function RevenueModelConfigurator({
  placementId,
  current,
  sampleBookedPence = 2_000_000,
}: RevenueModelConfiguratorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [modelKind, setModelKind] = useState<ModelKind>("revenue_share");
  const [sharePercent, setSharePercent] = useState("");
  const [flatFeePounds, setFlatFeePounds] = useState("");
  const [guaranteePounds, setGuaranteePounds] = useState("");
  const [overagePercent, setOveragePercent] = useState("");

  const previewModel = useMemo(
    () =>
      buildModel(
        modelKind,
        sharePercent,
        flatFeePounds,
        guaranteePounds,
        overagePercent,
      ),
    [modelKind, sharePercent, flatFeePounds, guaranteePounds, overagePercent],
  );

  const previewEarnPence = previewModel
    ? venueShareForBooked(sampleBookedPence, previewModel)
    : null;

  function openForm() {
    const next = formStateFromModel(current);
    setModelKind(next.modelKind);
    setSharePercent(next.sharePercent);
    setFlatFeePounds(next.flatFeePounds);
    setGuaranteePounds(next.guaranteePounds);
    setOveragePercent(next.overagePercent);
    setOpen(true);
  }

  function collapse() {
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateBeforeSave(
      modelKind,
      sharePercent,
      flatFeePounds,
      guaranteePounds,
      overagePercent,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const pricing = buildModel(
      modelKind,
      sharePercent,
      flatFeePounds,
      guaranteePounds,
      overagePercent,
    );
    if (!pricing) {
      toast.error("Complete all revenue model fields.");
      return;
    }

    startTransition(async () => {
      const result = await updatePlacementPricing({ placementId, pricing });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Revenue model saved");
      collapse();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {current && (
          <p className="text-xs text-muted-foreground">
            {formatRevenueModel(current)}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={openForm}>
          {current ? "Change revenue model" : "Set revenue model"}
        </Button>
      </div>
    );
  }

  const sampleBookedPounds = (sampleBookedPence / 100).toLocaleString("en-GB");

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-heading text-sm font-semibold text-foreground">
          Revenue model
        </p>
        <Button variant="ghost" size="sm" onClick={collapse} type="button">
          <X size={14} />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`revenue-model-${placementId}`}>Model</Label>
          <NativeSelect
            id={`revenue-model-${placementId}`}
            value={modelKind}
            onChange={(e) => setModelKind(e.target.value as ModelKind)}
          >
            {(Object.keys(REVENUE_MODEL_LABELS) as ModelKind[]).map((key) => (
              <option key={key} value={key}>
                {REVENUE_MODEL_LABELS[key]}
              </option>
            ))}
          </NativeSelect>
        </div>

        {modelKind === "revenue_share" && (
          <div className="space-y-2">
            <Label htmlFor={`revenue-share-${placementId}`}>
              Your share (%)
            </Label>
            <Input
              id={`revenue-share-${placementId}`}
              type="number"
              min={1}
              max={100}
              value={sharePercent}
              onChange={(e) => setSharePercent(e.target.value)}
              placeholder="20"
            />
          </div>
        )}

        {modelKind === "fixed_fee" && (
          <div className="space-y-2">
            <Label htmlFor={`revenue-fee-${placementId}`}>Flat fee (£)</Label>
            <Input
              id={`revenue-fee-${placementId}`}
              type="number"
              min={0}
              step={1}
              value={flatFeePounds}
              onChange={(e) => setFlatFeePounds(e.target.value)}
              placeholder="5000"
            />
          </div>
        )}

        {modelKind === "guarantee_overage" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`revenue-guarantee-${placementId}`}>
                Guarantee (£)
              </Label>
              <Input
                id={`revenue-guarantee-${placementId}`}
                type="number"
                min={0}
                step={1}
                value={guaranteePounds}
                onChange={(e) => setGuaranteePounds(e.target.value)}
                placeholder="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`revenue-overage-${placementId}`}>
                Share above it (%)
              </Label>
              <Input
                id={`revenue-overage-${placementId}`}
                type="number"
                min={1}
                max={100}
                value={overagePercent}
                onChange={(e) => setOveragePercent(e.target.value)}
                placeholder="25"
              />
            </div>
          </div>
        )}

        {previewModel && previewEarnPence !== null && (
          <p className="text-xs text-muted-foreground">
            On £{sampleBookedPounds} of bookings you&apos;d earn £
            {(previewEarnPence / 100).toLocaleString("en-GB")}
          </p>
        )}
      </div>

      <div className="mt-5">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          Save revenue model
        </Button>
      </div>
    </form>
  );
}
