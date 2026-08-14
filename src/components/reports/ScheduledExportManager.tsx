"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Download,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatDateMedium } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  createScheduledExport,
  toggleScheduledExport,
  deleteScheduledExport,
  executeExportNow,
  type ScheduledExport,
  type ExportFrequency,
  type ExportFormat,
  type ExportField,
} from "@/app/actions/scheduled-exports";

const FREQUENCY_OPTIONS: { value: ExportFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "end_of_event", label: "End of event" },
  { value: "on_demand", label: "On demand" },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
];

const FIELD_OPTIONS: { value: ExportField; label: string }[] = [
  { value: "leads", label: "Leads" },
  { value: "scores", label: "Game scores" },
  { value: "metrics", label: "Metrics" },
  { value: "custom_fields", label: "Custom fields" },
];

export function ScheduledExportManager({
  eventId,
  exports: initialExports,
}: {
  eventId: string;
  exports: ScheduledExport[];
}) {
  const [exports, setExports] = useState(initialExports);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [frequency, setFrequency] = useState<ExportFrequency>("daily");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [fields, setFields] = useState<Set<ExportField>>(new Set(["leads"]));
  const [recipients, setRecipients] = useState("");

  const toggleField = (f: ExportField) => {
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const handleCreate = () => {
    if (fields.size === 0) return;
    startTransition(async () => {
      const recipientList = recipients.split(",").map((r) => r.trim()).filter(Boolean);
      const result = await createScheduledExport(eventId, {
        frequency,
        format,
        includeFields: [...fields],
        recipients: recipientList,
      });
      if (result.success) {
        setShowForm(false);
        setRecipients("");
        const mod = await import("@/app/actions/scheduled-exports");
        const updated = await mod.getScheduledExports(eventId);
        setExports(updated);
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleScheduledExport(id, active);
      setExports((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: active } : e))
      );
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteScheduledExport(id);
      setExports((prev) => prev.filter((e) => e.id !== id));
    });
  };

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const handleRunNow = (id: string) => {
    startTransition(async () => {
      const result = await executeExportNow(id);
      if (result.success && result.url) {
        setDownloadUrl(result.url);
        setTimeout(() => setDownloadUrl(null), 10000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {exports.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">
          No scheduled exports. Set one up to receive data automatically.
        </p>
      )}

      {exports.map((exp) => (
        <div
          key={exp.id}
          className={cn(
            "flex items-center justify-between gap-4 p-4 border rounded-md transition-colors",
            exp.isActive ? "border-border/60 bg-card/40" : "border-border/30 bg-card/20 opacity-60"
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="capitalize">{exp.frequency}</span>
              <span className="text-muted-foreground">·</span>
              <span className="uppercase text-xs">{exp.format}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fields: {exp.includeFields.join(", ")}
            </p>
            {exp.recipients.length > 0 && (
              <p className="text-xs text-muted-foreground">
                To: {exp.recipients.join(", ")}
              </p>
            )}
            {exp.lastSentAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock size={10} />
                Last sent {formatDateMedium(exp.lastSentAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleRunNow(exp.id)}
              className="p-1.5 text-muted-foreground hover:text-[var(--color-bb-cobalt)] transition-colors"
              title="Run now"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => handleToggle(exp.id, !exp.isActive)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title={exp.isActive ? "Pause" : "Activate"}
            >
              {exp.isActive ? <PowerOff size={14} /> : <Power size={14} />}
            </button>
            <button
              onClick={() => handleDelete(exp.id)}
              className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {downloadUrl && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-sm">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline underline-offset-2"
          >
            Download export
          </a>
        </div>
      )}

      {showForm ? (
        <div className="border border-border/60 rounded-md p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Frequency</span>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ExportFrequency)}
                className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/40 rounded outline-none"
              >
                {FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/40 rounded outline-none"
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Include fields</span>
            <div className="flex flex-wrap gap-2">
              {FIELD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleField(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full border transition-colors",
                    fields.has(opt.value)
                      ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10 text-[var(--color-bb-cobalt)]"
                      : "border-border/40 text-muted-foreground hover:border-border"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-1 block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Recipients (comma-separated emails)
            </span>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="team@example.com, client@example.com"
              className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/40 rounded outline-none focus:border-[var(--color-bb-cobalt)] transition-colors"
            />
          </label>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending || fields.size === 0} className="text-xs">
              {isPending ? "Creating…" : "Create export"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={12} /> Add scheduled export
        </Button>
      )}
    </div>
  );
}
