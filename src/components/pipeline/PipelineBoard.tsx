/** Kanban-style pipeline board with filter state — renders columns per stage. */
"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PipelineCard } from "./PipelineCard";
import { advanceStage } from "@/app/actions/stages";
import { STAGE_CONFIG } from "@/types";
import type { Stage, HealthStatus } from "@/types";
import type { PipelineEvent } from "@/lib/queries/pipeline";
import { cn } from "@/lib/utils";

const DISPLAY_STAGES: Stage[] = [
  "confirmed",
  "kickoff_complete",
  "creative_assets",
  "approvals",
  "build_configuration",
  "qa_readiness",
  "logistics_confirmed",
  "event_live",
  "reporting",
  "complete",
];

const HEALTH_OPTIONS: { value: HealthStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "green", label: "Green" },
  { value: "amber", label: "Amber" },
  { value: "red", label: "Red" },
];

interface PipelineBoardProps {
  events: PipelineEvent[];
  owners: string[];
  /** Whether this viewer's role may advance the pipeline stage by dragging. */
  canManageStage?: boolean;
  /** Seed the health dropdown from URL preset params. */
  initialHealth?: HealthStatus | "all";
}

/** The stage immediately after `stage`, or null at the end of the pipeline. */
function nextStageOf(stage: Stage): Stage | null {
  const order = STAGE_CONFIG[stage].order;
  return DISPLAY_STAGES.find((s) => STAGE_CONFIG[s].order === order + 1) ?? null;
}

export function PipelineBoard({
  events,
  owners,
  canManageStage = false,
  initialHealth = "all",
}: PipelineBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthStatus | "all">(
    initialHealth,
  );
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Drag-to-advance: only the dragged event's immediate next stage is a
  // valid drop target; the server still enforces the gate on drop. Only
  // orchestration roles (events_lead/admin) can drag at all.
  const [dragging, setDragging] = useState<{ id: string; from: Stage } | null>(
    null,
  );
  const validTarget = dragging ? nextStageOf(dragging.from) : null;

  /** Advance one event to its immediate next stage (shared by drag + tap). */
  function advanceEvent(id: string) {
    startTransition(async () => {
      const res = await advanceStage(id);
      if (res.success) {
        toast.success(`Advanced to ${STAGE_CONFIG[res.data.to].label}.`);
        router.refresh();
      } else {
        toast.error("Gate not met", { description: res.error });
      }
    });
  }

  function handleDrop(targetStage: Stage) {
    const drag = dragging;
    setDragging(null);
    if (!drag) return;
    if (targetStage !== nextStageOf(drag.from)) {
      toast.error("Events can only move to the next stage.");
      return;
    }
    advanceEvent(drag.id);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.accountName.toLowerCase().includes(q)) return false;
      if (healthFilter !== "all" && e.healthStatus !== healthFilter) return false;
      if (ownerFilter !== "all" && (e.ownerName ?? "") !== ownerFilter) return false;
      return true;
    });
  }, [events, search, healthFilter, ownerFilter]);

  const byStage = useMemo(() => {
    const map: Record<string, PipelineEvent[]> = {};
    for (const s of DISPLAY_STAGES) map[s] = [];
    for (const e of filtered) {
      if (map[e.currentStage]) map[e.currentStage].push(e);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events or accounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          aria-label="Filter by health"
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as HealthStatus | "all")}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {HEALTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          aria-label="Filter by owner"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-4" style={{ minWidth: `${DISPLAY_STAGES.length * 296}px` }}>
          {DISPLAY_STAGES.map((stage) => {
            const items = byStage[stage] ?? [];
            const isValidTarget = validTarget === stage;
            return (
              <div key={stage} className="w-[280px] shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-overline text-muted-foreground">
                    {STAGE_CONFIG[stage].shortLabel}
                  </h2>
                  <span className={cn(
                    "text-xs font-semibold tabular-nums rounded-full px-2 py-0.5",
                    items.length > 0 ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                  )}>
                    {items.length}
                  </span>
                </div>
                <div
                  onDragOver={(e) => {
                    if (isValidTarget) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(stage);
                  }}
                  className={cn(
                    "flex flex-col gap-2 min-h-[120px] rounded-lg p-2 transition-colors",
                    isValidTarget
                      ? "bg-brand/10 ring-2 ring-brand/40 ring-inset"
                      : dragging
                        ? "bg-muted/20"
                        : "bg-muted/30",
                    pending && "opacity-60",
                  )}
                >
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 opacity-60">
                      {isValidTarget ? "Drop to advance" : "No events"}
                    </p>
                  ) : (
                    items.map((e) => {
                      const next = nextStageOf(e.currentStage);
                      return (
                        <div
                          key={e.id}
                          draggable={canManageStage && !pending}
                          onDragStart={() =>
                            canManageStage &&
                            setDragging({ id: e.id, from: e.currentStage })
                          }
                          onDragEnd={() => setDragging(null)}
                          className={cn(
                            canManageStage && "cursor-grab active:cursor-grabbing",
                            dragging?.id === e.id && "opacity-40",
                          )}
                        >
                          <PipelineCard event={e} />
                          {canManageStage && next && (
                            <button
                              type="button"
                              onClick={() => advanceEvent(e.id)}
                              disabled={pending}
                              className="lg:hidden mt-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            >
                              Advance to {STAGE_CONFIG[next].shortLabel}
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
