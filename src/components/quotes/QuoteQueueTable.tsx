/** Quote pipeline table — tabbed status filter, search, and direct-edit links */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { CalendarCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { cn } from "@/lib/utils";
import { formatNumberUS } from "@/lib/currency";
import { formatTimestamp } from "@/lib/dates";
import type { QuoteStatus, QuoteTrack } from "@/types";

interface QuoteRow {
  id: string;
  track: QuoteTrack;
  status: QuoteStatus;
  contact_name: string;
  contact_email: string;
  company_name?: string;
  event_type?: string;
  created_at: string;
  reach_track?: string | null;
  estimated_impressions?: number | null;
  walkthrough_scheduled_at?: string | null;
  walkthrough_slot_label?: string | null;
}

interface QuoteQueueTableProps {
  quotes: QuoteRow[];
}

const STATUS_TABS: { value: QuoteStatus | "open" | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "submitted", label: "Submitted" },
  { value: "proposal_sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

function TimestampCell({ dateStr }: { dateStr: string }) {
  const { display, exact } = formatTimestamp(dateStr);
  return (
    <span className="tabular-nums" title={exact || undefined}>
      {display}
    </span>
  );
}

export function QuoteQueueTable({ quotes }: QuoteQueueTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "open" | "all">("open");
  const [trackFilter, setTrackFilter] = useState<QuoteTrack | "all">("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0 };
    for (const q of quotes) {
      c[q.status] = (c[q.status] ?? 0) + 1;
      if (q.status === "submitted" || q.status === "draft" || q.status === "proposal_sent") {
        c.open++;
      }
    }
    c.all = quotes.length;
    return c;
  }, [quotes]);

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (statusFilter === "open") {
        if (!["submitted", "draft", "proposal_sent"].includes(q.status)) return false;
      } else if (statusFilter !== "all" && q.status !== statusFilter) {
        return false;
      }
      if (trackFilter !== "all" && q.track !== trackFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          q.contact_name.toLowerCase().includes(s) ||
          q.contact_email.toLowerCase().includes(s) ||
          (q.company_name?.toLowerCase().includes(s) ?? false)
        );
      }
      return true;
    });
  }, [quotes, search, statusFilter, trackFilter]);

  return (
    <Card tone="subtle" className="overflow-hidden">
      <div className="border-b border-border/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search by name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as QuoteTrack | "all")}
            aria-label="Filter by track"
            className="h-10 rounded-[var(--radius-control)] border border-input bg-[hsl(233,48%,15%,0.6)] px-3.5 text-sm text-foreground"
          >
            <option value="all">All tracks</option>
            <option value="book_now">Book Now</option>
            <option value="proposal">Proposal</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const count = counts[tab.value] ?? 0;
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {tab.label}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No quotes match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-overline text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium tabular-nums">Reach</th>
                  <th className="px-4 py-3 font-medium">Meeting</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border/60 transition-colors hover:bg-accent"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/quotes/${q.id}`} className="block">
                        <span className="font-medium text-foreground">
                          {q.contact_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {q.company_name ?? q.contact_email}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={q.track === "book_now" ? "info" : "default"}>
                        {q.track === "book_now" ? "Book now" : "Proposal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {q.event_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {q.estimated_impressions ? (
                        <span className="text-foreground">
                          {formatNumberUS(q.estimated_impressions)}
                          <span className="ml-1 text-xs text-muted-foreground">impr.</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {q.walkthrough_scheduled_at ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(142_60%_40%)]/30 bg-[hsl(142_60%_40%)]/10 px-2 py-0.5 text-xs font-medium text-[hsl(142_50%_42%)]">
                          <CalendarCheck className="h-3 w-3" aria-hidden />
                          {q.walkthrough_slot_label ??
                            new Date(q.walkthrough_scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <TimestampCell dateStr={q.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
