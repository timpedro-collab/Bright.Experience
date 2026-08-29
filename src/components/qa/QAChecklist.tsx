"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle, Wrench, Minus, Plus, Loader2 } from "lucide-react";
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

const QA_SIGN_OFF_ROLES: UserRole[] = ["qa_lead", "events_lead", "admin"];

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
  passed: { label: "Passed", className: "bg-success/15 text-success border-success/30" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" },
  fixed: { label: "Fixed", className: "bg-primary/15 text-primary border-primary/30" },
  na: { label: "N/A", className: "bg-muted text-muted-foreground" },
} as const;

export function QAChecklist({ eventId, items, isInternal, viewerRole }: QAChecklistProps) {
  // Conditional dependency: if the machine ships in a Bright.Blue Box (Yes),
  // the standalone "packed and wrapped properly" check no longer applies.
  const brightBlueBox = items.find((i) => /bright\.?blue box/i.test(i.title));
  const boxAnswer = brightBlueBox ? yesNoAnswer(brightBlueBox) : null;
  const visibleItems =
    boxAnswer === "yes"
      ? items.filter((i) => !/packed and wrapped properly/i.test(i.title))
      : items;

  const grouped = groupByCategory(visibleItems);

  const passed = visibleItems.filter((i) => i.status === "passed").length;
  const total = visibleItems.filter((i) => i.status !== "na").length;
  const readinessScore = total > 0 ? Math.round((passed / total) * 100) : 0;
  const outstanding = visibleItems.filter(
    (i) => i.status !== "passed" && i.status !== "fixed" && i.status !== "na",
  ).length;
  const allResolved = visibleItems.length > 0 && outstanding === 0;
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
  const checkRef = useRef<HTMLButtonElement>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const cfg = STATUS_CONFIG[item.status];
  const isComplete = item.status === "passed" || item.status === "fixed";
  const yesNo = isYesNoItem(item);
  const answer = yesNoAnswer(item);

  // Yes → passed, No → na. Persisting via status keeps the answer durable and
  // lets the parent drive conditional checks (e.g. Bright.Blue Box).
  function answerYesNo(choice: "yes" | "no") {
    const status = choice === "yes" ? "passed" : "na";
    if (answer === choice) return;
    startTransition(async () => {
      const result = await updateQAItem(item.id, status);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (choice === "yes") celebrateFromElement(checkRef.current);
      toast.success(`Marked ${choice === "yes" ? "Yes" : "No"}`);
      router.refresh();
    });
  }

  function runUpdate(status: string) {
    startTransition(async () => {
      const result = await updateQAItem(item.id, status, notes || undefined);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setShowNotes(false);
      setNotes("");
      if (status === "passed") {
        celebrateFromElement(checkRef.current);
      }
      toast.success(
        status === "pending" ? "Marked not started" : `Marked as ${status}`,
      );
      router.refresh();
    });
  }

  // The checkbox is the primary "check it off" affordance: ticking a not-yet
  // passed item passes it; un-ticking a completed item returns it to pending.
  function handleToggle() {
    if (item.status === "na") return;
    runUpdate(isComplete ? "pending" : "passed");
  }

  function handleFail() {
    if (!showNotes) {
      setShowNotes(true);
      return;
    }
    runUpdate("failed");
  }

  return (
    <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
      {yesNo ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground truncate">{item.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            {isInternal ? (
              <div className="inline-flex overflow-hidden rounded-lg border border-border">
                <button
                  ref={checkRef}
                  type="button"
                  disabled={pending}
                  aria-pressed={answer === "yes"}
                  onClick={() => answerYesNo("yes")}
                  className={cn(
                    "px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    answer === "yes"
                      ? "bg-success/15 text-success"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  disabled={pending}
                  aria-pressed={answer === "no"}
                  onClick={() => answerYesNo("no")}
                  className={cn(
                    "border-l border-border px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    answer === "no"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  No
                </button>
              </div>
            ) : (
              <Badge className="text-[10px] shrink-0">
                {answer === "yes" ? "Yes" : answer === "no" ? "No" : "Pending"}
              </Badge>
            )}
            {pending && (
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isInternal ? (
              <button
                ref={checkRef}
                type="button"
                role="checkbox"
                aria-checked={isComplete}
                aria-label={
                  isComplete
                    ? `Mark "${item.title}" not done`
                    : `Mark "${item.title}" done`
                }
                disabled={pending || item.status === "na"}
                onClick={handleToggle}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isComplete
                    ? "border-success/40 bg-success/15 text-success"
                    : item.status === "failed"
                      ? "border-destructive/40 text-destructive"
                      : "border-border bg-muted/40 text-transparent hover:border-success/50 hover:text-success/60",
                  (pending || item.status === "na") && "opacity-60",
                )}
              >
                {pending ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                ) : item.status === "failed" ? (
                  <XCircle size={14} />
                ) : (
                  <Check size={14} strokeWidth={3} />
                )}
              </button>
            ) : (
              <StatusIcon status={item.status} />
            )}
            <span
              className={cn(
                "text-sm truncate",
                isComplete ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {item.title}
            </span>
            <Badge className={cn("text-[10px] shrink-0", cfg.className)}>
              {cfg.label}
            </Badge>
          </div>

          {isInternal && !pending && (
            <div className="flex items-center gap-1 shrink-0">
              {item.status === "failed" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-brand"
                  onClick={() => runUpdate("fixed")}
                >
                  <Wrench size={12} /> Mark fixed
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleFail}
                >
                  <XCircle size={12} /> Flag issue
                </Button>
              )}
            </div>
          )}
          {pending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        </div>
      )}

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
            <Button size="sm" variant="brand" onClick={() => runUpdate("failed")}>
              Confirm issue
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

      {item.testedBy && !looksLikeId(item.testedBy) && (
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
        aria-label="Check category"
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
        <CelebrationCheck size={14} className="text-success" />
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

/** True for raw UUID/opaque-id strings we don't want to surface as a name. */
function looksLikeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

/** Y/N checks render a Yes/No toggle instead of a single check-off box. */
function isYesNoItem(item: QAItem): boolean {
  return /\(y\/n\)/i.test(item.title);
}

/** Derive the stored Yes/No answer from status (Yes → passed, No → na). */
function yesNoAnswer(item: QAItem): "yes" | "no" | null {
  if (item.status === "passed") return "yes";
  if (item.status === "na") return "no";
  return null;
}

function groupByCategory(items: QAItem[]): Record<string, QAItem[]> {
  return items.reduce<Record<string, QAItem[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}
