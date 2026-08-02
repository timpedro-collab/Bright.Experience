/** Filterable, sortable leads table with CSV export */
"use client";

import { useState, useMemo } from "react";
import { Download, Search, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/dates";

interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source: string;
  capturedAt: string;
  age?: number | null;
}

interface LeadTableProps {
  leads: Lead[];
}

type SortField = "contactName" | "contactEmail" | "source" | "capturedAt";
type SortDir = "asc" | "desc";

function TimestampCell({ dateStr }: { dateStr: string }) {
  const { display, exact } = formatTimestamp(dateStr);
  return (
    <span className="tabular-nums" title={exact || undefined}>
      {display}
    </span>
  );
}

function downloadCSV(leads: Lead[]) {
  const headers = ["Name", "Email", "Phone", "Age", "Source", "Captured At"];
  const rows = leads.map((l) => [
    l.contactName,
    l.contactEmail,
    l.contactPhone ?? "",
    l.age != null ? String(l.age) : "",
    l.source,
    l.capturedAt,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadTable({ leads }: LeadTableProps) {
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("capturedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return leads.filter(
      (l) =>
        l.contactName.toLowerCase().includes(q) ||
        l.contactEmail.toLowerCase().includes(q)
    );
  }, [leads, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Filter by name or email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 bg-muted/40 border-glass-border"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCSV(filtered)}
          className="gap-2"
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-glass-border overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No leads found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <SortableHead
                  label="Name"
                  field="contactName"
                  active={sortField}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortableHead
                  label="Email"
                  field="contactEmail"
                  active={sortField}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground tabular-nums">Age</TableHead>
                <SortableHead
                  label="Source"
                  field="source"
                  active={sortField}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortableHead
                  label="Captured At"
                  field="capturedAt"
                  active={sortField}
                  dir={sortDir}
                  onSort={toggleSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-border/60 hover:bg-accent"
                >
                  <TableCell className="font-medium text-foreground">
                    {lead.contactName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.contactEmail}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.contactPhone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {lead.age != null ? lead.age : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <TimestampCell dateStr={lead.capturedAt} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function SortableHead({
  label,
  field,
  active,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  active: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const sorted = active === field;
  return (
    <TableHead
      className={cn(
        "text-muted-foreground select-none transition-colors",
        sorted && "text-foreground"
      )}
      aria-sort={sorted ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown size={12} className="opacity-50" aria-hidden="true" />
        <span className="sr-only">
          {sorted
            ? `sorted ${dir === "asc" ? "ascending" : "descending"}, activate to reverse`
            : "activate to sort"}
        </span>
      </button>
    </TableHead>
  );
}
