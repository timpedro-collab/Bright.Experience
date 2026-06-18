/**
 * Dense, multi-select table view of the internal events library.
 *
 * Built for orchestrators triaging many events at once: sortable-by-eye rows,
 * health + stage at a glance, and a bulk-select bar that exports the chosen
 * events to CSV (client-side — no server round trip, demo-safe).
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";

import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDateMedium } from "@/lib/dates";
import { STAGE_CONFIG, type Stage, type HealthStatus } from "@/types";

export interface LibraryRow {
  id: string;
  name: string;
  accountName: string;
  venueName?: string;
  currentStage: Stage;
  healthStatus: HealthStatus;
  eventDateStart: string;
  openTasks: number;
}

export function EventsLibraryTable({ rows }: { rows: LibraryRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected],
  );

  function exportCsv() {
    const header = ["Event", "Account", "Venue", "Stage", "Health", "Date", "Open tasks"];
    const lines = selectedRows.map((r) =>
      [
        r.name,
        r.accountName,
        r.venueName ?? "",
        STAGE_CONFIG[r.currentStage].label,
        r.healthStatus,
        formatDateMedium(r.eventDateStart),
        String(r.openTasks),
      ]
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="brand" size="sm" onClick={exportCsv}>
              <Download size={14} /> Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X size={14} /> Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-overline text-muted-foreground">
              <th className="py-2.5 pl-4 pr-2 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="accent-[var(--color-bb-cobalt)]"
                />
              </th>
              <th className="py-2.5 pr-4">Event</th>
              <th className="py-2.5 pr-4">Stage</th>
              <th className="py-2.5 pr-4">Health</th>
              <th className="py-2.5 pr-4">Date</th>
              <th className="py-2.5 pr-4 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/20 transition-colors hover:bg-accent/20"
              >
                <td className="py-2.5 pl-4 pr-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.name}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    className="accent-[var(--color-bb-cobalt)]"
                  />
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/events/${row.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {row.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {row.accountName}
                    {row.venueName ? ` · ${row.venueName}` : ""}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <StageBadge stage={row.currentStage} />
                </td>
                <td className="py-2.5 pr-4">
                  <HealthBadge status={row.healthStatus} />
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                  {formatDateMedium(row.eventDateStart)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                  {row.openTasks > 0 ? row.openTasks : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
