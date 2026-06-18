"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Wrench, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateQAItem, addQAItem } from "@/app/actions/qa";
import { celebrateFromElement } from "@/lib/celebrate";
import { CelebrationCheck } from "@/components/ui/CelebrationCheck";
import { AllClearState } from "@/components/ui/AllClearState";
import { QASignOffPanel } from "@/components/qa/QASignOffPanel";
import type { QAItem, QACategory, UserRole } from "@/types";

interface QAChecklistProps {
  eventId: string;
  items: QAItem[];
  isInternal: boolean;
  viewerRole?: UserRole;
}

const QA_SIGN_OFF_ROLES: UserRole[] = ["qa_lead", "events_lead", "admin", "developer"];

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

export function QAChecklist({ eventId, items, isInternal, viewerRole }: QAChecklistProps) {
  const grouped = groupByCategory(items);

  const passed = items.filter((i) => i.status === "passed").length;
  const total = items.filter((i) => i.status !== "na").length;
  const readinessScore = total > 0 ? Math.round((passed / total) * 100) : 0;
  const outstanding = items.filter(
    (i) => i.status !== "passed" && i.status !== "fixed" && i.status !== "na",
  ).length;
  const allResolved = items.length > 0 && outstanding === 0;
  const canSignOff = viewerRole ? QA_SIGN_OFF_ROLES.includes(viewerRole) : false;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <span className="text-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums text-foreground">
          {readinessScore}%
        </span>
        <span className="text-overline text-muted-foreground">
          checks complete · {passed} of {total} passed
        </span>
      </div>

      {allResolved && <AllClearState variant="qa" />}

      {allResolved && canSignOff && <QASignOffPanel eventId={eventId} />}

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="text-heading text-sm font-semibold text-foreground mb-3">
            {CATEGORY_LABELS[category as QACategory] ?? category}
          </h3>
          <div className="space-y-2">
            {categoryItems.map((item) => (
              <QARow key={item.id} item={item} isInternal={isInternal} />
            ))}
          </div>
        </section>
      ))}

      {isInternal && <AddQAItemForm eventId={eventId} />}
    </div>
  );
}

function QARow({ item, isInternal }: { item: QAItem; isInternal: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const passRef = useRef<HTMLButtonElement>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const cfg = STATUS_CONFIG[item.status];

  function handleAction(status: string) {
    if (status === "failed" && !showNotes) {
      setShowNotes(true);
      return;
    }

    startTransition(async () => {
      const result = await updateQAItem(item.id, status, notes || undefined);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setShowNotes(false);
      setNotes("");
      if (status === "passed") {
        celebrateFromElement(passRef.current);
      }
      toast.success(`Marked as ${status}`);
      router.refresh();
    });
  }

  return (
    <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon status={item.status} />
          <span className="text-sm text-foreground truncate">{item.title}</span>
          <Badge className={cn("text-[10px] shrink-0", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>

        {isInternal && !pending && (
          <div className="flex items-center gap-1 shrink-0">
            {(item.status === "pending" || item.status === "fixed") && (
              <Button
                ref={passRef}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-400"
                onClick={() => handleAction("passed")}
              >
                <CheckCircle2 size={12} /> Pass
              </Button>
            )}
            {(item.status === "pending" || item.status === "passed") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => handleAction("failed")}
              >
                <XCircle size={12} /> Fail
              </Button>
            )}
            {item.status === "failed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-brand"
                onClick={() => handleAction("fixed")}
              >
                <Wrench size={12} /> Fix
              </Button>
            )}
          </div>
        )}
        {pending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
      </div>

      {showNotes && (
        <div className="mt-3 ml-7 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the failure…"
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="brand" onClick={() => handleAction("failed")}>
              Confirm fail
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNotes(false);
                setNotes("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {item.testedBy && (
        <p className="text-[11px] text-muted-foreground mt-2 ml-7">
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

function AddQAItemForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("machine");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add check
      </Button>
    );
  }

  function handleSubmit() {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await addQAItem(eventId, title, category);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTitle("");
      setOpen(false);
      toast.success("Check added");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Check title"
        className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button size="sm" variant="brand" onClick={handleSubmit} disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: QAItem["status"] }) {
  if (status === "passed") {
    return (
      <span className="shrink-0">
        <CelebrationCheck size={14} className="text-emerald-400" />
      </span>
    );
  }
  const map = {
    pending: <Minus size={14} className="text-muted-foreground" />,
    failed: <XCircle size={14} className="text-destructive" />,
    fixed: <Wrench size={14} className="text-brand" />,
    na: <Minus size={14} className="text-muted-foreground" />,
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
