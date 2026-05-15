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

interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source: string;
  capturedAt: string;
}

interface LeadTableProps {
  leads: Lead[];
}

type SortField = "contactName" | "contactEmail" | "source" | "capturedAt";
type SortDir = "asc" | "desc";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCSV(leads: Lead[]) {
  const headers = ["Name", "Email", "Phone", "Source", "Captured At"];
  const rows = leads.map((l) => [
    l.contactName,
    l.contactEmail,
    l.contactPhone ?? "",
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            placeholder="Filter by name or email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 bg-white/[0.03] border-glass-border"
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
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
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
              <TableHead className="text-text-muted">Phone</TableHead>
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
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-text-muted py-8"
                >
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <TableCell className="font-medium text-text-primary">
                    {lead.contactName}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {lead.contactEmail}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {lead.contactPhone ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {lead.source}
                  </TableCell>
                  <TableCell className="text-text-secondary tabular-nums">
                    {formatDateTime(lead.capturedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
  return (
    <TableHead
      className={cn(
        "text-text-muted cursor-pointer select-none hover:text-text-primary transition-colors",
        active === field && "text-text-primary"
      )}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="opacity-50" />
      </span>
    </TableHead>
  );
}
