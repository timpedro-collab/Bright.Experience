"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2, Copy, Cpu, FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveMachineConfiguration } from "@/app/actions/game-config";
import {
  SPIRAL_SIZES,
  type MachineLane,
  type MachineMechanism,
  type MachineWidth,
  type SpiralSize,
} from "@/lib/configuration/machine-config";

interface MachineBuildFormProps {
  eventId: string;
  lanes: MachineLane[];
  samplesReceivedAt: string | null;
  samplesTested: boolean;
  /** Product names from the customer's mix, for per-lane assignment. */
  products: string[];
  /** Ops authors; QA and other read-only viewers cannot edit. */
  canEdit: boolean;
}

const MECHANISMS: { value: MachineMechanism; label: string }[] = [
  { value: "belt", label: "Belt" },
  { value: "pusher", label: "Pusher" },
  { value: "spiral", label: "Spiral" },
];

const WIDTHS: { value: MachineWidth; label: string }[] = [
  { value: "single", label: "Single wide" },
  { value: "double", label: "Double wide" },
];

const MECHANISM_LABEL: Record<MachineMechanism, string> = {
  belt: "Belt",
  pusher: "Pusher",
  spiral: "Spiral",
};

const WIDTH_LABEL: Record<MachineWidth, string> = {
  single: "Single wide",
  double: "Double wide",
};

const selectClass =
  "w-full px-2.5 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function newLane(from?: MachineLane): MachineLane {
  if (from) return { ...from };
  return { mechanism: "spiral", width: "single", spiralSize: 7 };
}

function laneDescriptor(lane: MachineLane): string {
  const parts = [WIDTH_LABEL[lane.width], MECHANISM_LABEL[lane.mechanism]];
  if (lane.mechanism === "spiral" && lane.spiralSize) {
    parts.push(`· ${lane.spiralSize}-count`);
  }
  return parts.join(" ");
}

export function MachineBuildForm({
  eventId,
  lanes: initialLanes,
  samplesReceivedAt: initialSamplesAt,
  samplesTested: initialTested,
  products,
  canEdit,
}: MachineBuildFormProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [lanes, setLanes] = useState<MachineLane[]>(initialLanes);
  const [samplesReceivedAt, setSamplesReceivedAt] = useState(
    initialSamplesAt ? initialSamplesAt.slice(0, 10) : ""
  );
  const [samplesTested, setSamplesTested] = useState(initialTested);

  function update(i: number, partial: Partial<MachineLane>) {
    setLanes((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...partial };
      // Drop a stale spiral size when switching away from spirals.
      if (partial.mechanism && partial.mechanism !== "spiral") {
        delete next[i].spiralSize;
      }
      if (partial.mechanism === "spiral" && !next[i].spiralSize) {
        next[i].spiralSize = 7;
      }
      return next;
    });
  }

  function addLane() {
    setLanes((prev) => [...prev, newLane(prev[prev.length - 1])]);
  }

  function duplicateLane(i: number) {
    setLanes((prev) => {
      const next = [...prev];
      next.splice(i + 1, 0, newLane(prev[i]));
      return next;
    });
  }

  function removeLane(i: number) {
    setLanes((prev) => prev.filter((_, j) => j !== i));
  }

  function handleSave() {
    startSave(async () => {
      const result = await saveMachineConfiguration(eventId, {
        machineConfigJson: lanes,
        samplesReceivedAt: samplesReceivedAt || null,
        samplesTested,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Machine build saved", {
        description: "This setup is now recorded for the event.",
      });
      router.refresh();
    });
  }

  // Breakdown summary (e.g. "8 lanes · 5 spiral, 2 belt, 1 pusher").
  const counts = lanes.reduce(
    (acc, l) => {
      acc[l.mechanism] += 1;
      return acc;
    },
    { belt: 0, pusher: 0, spiral: 0 } as Record<MachineMechanism, number>
  );
  const breakdown = MECHANISMS.filter((m) => counts[m.value] > 0)
    .map((m) => `${counts[m.value]} ${m.label.toLowerCase()}`)
    .join(", ");

  // ---- Read-only view (QA / non-editors) -------------------------------
  if (!canEdit) {
    return (
      <Card tone="subtle" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Machine build</h3>
          {lanes.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {lanes.length} lane{lanes.length === 1 ? "" : "s"}
              {breakdown ? ` · ${breakdown}` : ""}
            </span>
          )}
        </div>
        {lanes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Operations hasn&apos;t recorded the machine build yet.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {lanes.map((lane, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-overline text-muted-foreground w-8 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground">{laneDescriptor(lane)}</span>
                {lane.product && (
                  <span className="ml-auto text-muted-foreground">{lane.product}</span>
                )}
              </li>
            ))}
          </ol>
        )}
        <div className="flex items-center gap-2 pt-1 text-sm">
          <FlaskConical size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">Samples:</span>
          <span className={samplesTested ? "text-success" : "text-foreground"}>
            {samplesTested ? "Tested" : samplesReceivedAt ? "Received, not tested" : "Awaiting samples"}
          </span>
        </div>
      </Card>
    );
  }

  // ---- Editable view (Operations) --------------------------------------
  return (
    <Card tone="subtle" className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Cpu size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Machine build</h3>
        {lanes.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {lanes.length} lane{lanes.length === 1 ? "" : "s"}
            {breakdown ? ` · ${breakdown}` : ""}
          </span>
        )}
      </div>
      <p className="-mt-3 text-sm text-muted-foreground max-w-[64ch]">
        Record the physical setup lane by lane. Add a lane, pick the mechanism
        and width, and (optionally) assign which product loads into it.
      </p>

      {/* Visual lane preview — always shows current build at a glance */}
      {lanes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lanes.map((lane, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-foreground"
            >
              <span className="tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span>{laneDescriptor(lane)}</span>
              {lane.product && <span className="text-muted-foreground">· {lane.product}</span>}
            </div>
          ))}
        </div>
      )}

      {lanes.length > 0 && (
        <div className="space-y-2">
          <div
            className={`hidden sm:grid ${
              products.length > 0
                ? "grid-cols-[2rem_1fr_1fr_1fr_1.4fr_auto]"
                : "grid-cols-[2rem_1fr_1fr_1fr_auto]"
            } gap-2 px-1`}
          >
            <span className="text-overline text-muted-foreground">#</span>
            <span className="text-overline text-muted-foreground">Mechanism</span>
            <span className="text-overline text-muted-foreground">Width</span>
            <span className="text-overline text-muted-foreground">Spiral size</span>
            {products.length > 0 && (
              <span className="text-overline text-muted-foreground">Product</span>
            )}
            <span className="w-[4.5rem]" aria-hidden />
          </div>

          {lanes.map((lane, i) => (
            <div
              key={i}
              className={`grid ${
                products.length > 0
                  ? "grid-cols-2 sm:grid-cols-[2rem_1fr_1fr_1fr_1.4fr_auto]"
                  : "grid-cols-2 sm:grid-cols-[2rem_1fr_1fr_1fr_auto]"
              } gap-2 items-center`}
            >
              <span className="hidden sm:block text-overline text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>

              <select
                aria-label="Mechanism"
                value={lane.mechanism}
                onChange={(e) => update(i, { mechanism: e.target.value as MachineMechanism })}
                className={selectClass}
              >
                {MECHANISMS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Width"
                value={lane.width}
                onChange={(e) => update(i, { width: e.target.value as MachineWidth })}
                className={selectClass}
              >
                {WIDTHS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>

              {lane.mechanism === "spiral" ? (
                <select
                  aria-label="Spiral size"
                  value={lane.spiralSize ?? 7}
                  onChange={(e) =>
                    update(i, { spiralSize: Number(e.target.value) as SpiralSize })
                  }
                  className={selectClass}
                >
                  {SPIRAL_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}-count
                    </option>
                  ))}
                </select>
              ) : (
                <span className="hidden sm:flex items-center justify-center text-sm text-muted-foreground/50">
                  —
                </span>
              )}

              {products.length > 0 && (
                <select
                  aria-label="Product"
                  value={lane.product ?? ""}
                  onChange={(e) => update(i, { product: e.target.value || undefined })}
                  className={selectClass}
                >
                  <option value="">Unassigned</option>
                  {products.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicateLane(i)}
                  title="Duplicate lane"
                >
                  <Copy size={13} className="text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLane(i)}
                  title="Remove lane"
                >
                  <Trash2 size={14} className="text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={addLane}>
        <Plus size={12} /> Add lane
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-end pt-4 border-t border-border/60">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Samples received
          </label>
          <input
            type="date"
            value={samplesReceivedAt}
            onChange={(e) => setSamplesReceivedAt(e.target.value)}
            className="px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground pb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={samplesTested}
            onChange={(e) => setSamplesTested(e.target.checked)}
            className="size-4 rounded border-border accent-[var(--color-bb-cobalt)]"
          />
          Samples tested and vending correctly
        </label>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save machine build"}
        </Button>
      </div>
    </Card>
  );
}
