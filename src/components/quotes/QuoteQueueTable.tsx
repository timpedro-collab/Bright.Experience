/** Quote pipeline table — tabbed status filter, search, and direct-edit links */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { cn } from "@/lib/utils";
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
      <div className="border-b border-white/[0.06] p-4">
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
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-overline text-muted-foreground">
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
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
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(q.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No quotes match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
