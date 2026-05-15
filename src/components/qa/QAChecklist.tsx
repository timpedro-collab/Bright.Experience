/** QA checklist grouped by category with status badges and action buttons */
"use client";

import { CheckCircle2, XCircle, Wrench, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QAItem, QACategory } from "@/types";

interface QAChecklistProps {
  eventId: string;
  items: QAItem[];
  isInternal: boolean;
}

const CATEGORY_LABELS: Record<QACategory, string> = {
  machine: "Machine",
  game_logic: "Game Logic",
  ux_ui: "UX / UI",
  webform: "Web Form",
  wrap: "Wrap & Branding",
  logistics: "Logistics",
  product: "Product",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  passed: { label: "Passed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" },
  fixed: { label: "Fixed", className: "bg-brand/15 text-brand border-brand/30" },
  na: { label: "N/A", className: "bg-muted text-muted-foreground" },
} as const;

export function QAChecklist({ eventId, items, isInternal }: QAChecklistProps) {
  const grouped = groupByCategory(items);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="text-heading text-sm font-semibold text-text-primary mb-3">
            {CATEGORY_LABELS[category as QACategory] ?? category}
          </h3>
          <div className="space-y-2">
            {categoryItems.map((item) => (
              <QARow key={item.id} item={item} isInternal={isInternal} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function QARow({ item, isInternal }: { item: QAItem; isInternal: boolean }) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon status={item.status} />
          <span className="text-sm text-text-primary truncate">{item.title}</span>
          <Badge className={cn("text-[10px] shrink-0", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>

        {isInternal && (
          <div className="flex items-center gap-1 shrink-0">
            {(item.status === "pending" || item.status === "fixed") && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400">
                <CheckCircle2 size={12} /> Pass
              </Button>
            )}
            {(item.status === "pending" || item.status === "passed") && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                <XCircle size={12} /> Fail
              </Button>
            )}
            {item.status === "failed" && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-brand">
                <Wrench size={12} /> Fix
              </Button>
            )}
          </div>
        )}
      </div>

      {item.testedBy && (
        <p className="text-[11px] text-text-muted mt-2 ml-7">
          Tested by {item.testedBy}
        </p>
      )}
      {item.status === "failed" && item.failureReason && (
        <p className="text-xs text-destructive/80 mt-2 ml-7">{item.failureReason}</p>
      )}
      {item.status === "fixed" && item.fixDescription && (
        <p className="text-xs text-brand/80 mt-2 ml-7">{item.fixDescription}</p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: QAItem["status"] }) {
  const map = {
    pending: <Minus size={14} className="text-text-muted" />,
    passed: <CheckCircle2 size={14} className="text-emerald-400" />,
    failed: <XCircle size={14} className="text-destructive" />,
    fixed: <Wrench size={14} className="text-brand" />,
    na: <Minus size={14} className="text-text-muted" />,
  };
  return <span className="shrink-0">{map[status]}</span>;
}

function groupByCategory(items: QAItem[]): Record<string, QAItem[]> {
  return items.reduce<Record<string, QAItem[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}
