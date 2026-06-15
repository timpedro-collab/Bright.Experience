/** Reusable export dropdown — PDF, CSV, Excel options with loading states. */
"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportMenuProps {
  eventId: string;
  view: "reports" | "live" | "leads" | "overview";
  /** Hide PDF option (e.g. for overview KPIs). */
  hidePdf?: boolean;
}

const FORMATS = [
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "csv", label: "CSV", icon: File },
  { key: "excel", label: "Excel", icon: FileSpreadsheet },
] as const;

export function ExportMenu({ eventId, view, hidePdf }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const formats = hidePdf ? FORMATS.filter((f) => f.key !== "pdf") : FORMATS;

  async function handleExport(format: string) {
    setLoading(format);
    setOpen(false);
    const toastId = toast.loading(`Generating ${format.toUpperCase()}...`);

    try {
      const res = await fetch(
        `/api/events/${eventId}/export?format=${format}&view=${view}`,
      );

      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `export.${format === "excel" ? "xlsx" : format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} downloaded`, { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Export failed",
        { id: toastId },
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={loading !== null}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Export
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-md border border-border bg-card shadow-lg py-1">
            {formats.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleExport(key)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent/20 transition-colors"
              >
                <Icon size={14} className="text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
