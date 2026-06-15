/** Form for internal users to add a logistics entry to an event */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addLogisticsEntry } from "@/app/actions/logistics";

const ENTRY_TYPES = [
  { value: "delivery", label: "Delivery" },
  { value: "setup", label: "Setup" },
  { value: "collection", label: "De-rig / Collection" },
] as const;

interface AddLogisticsEntryFormProps {
  eventId: string;
}

export function AddLogisticsEntryForm({ eventId }: AddLogisticsEntryFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setEntryType("");
    setScheduledDate("");
    setNotes("");
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entryType) {
      toast.error("Please select a logistics type");
      return;
    }
    setLoading(true);
    const title = ENTRY_TYPES.find((t) => t.value === entryType)?.label ?? entryType;
    const result = await addLogisticsEntry(eventId, {
      entryType,
      title,
      scheduledDate: scheduledDate || undefined,
      description: notes || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Logistics entry added");
    reset();
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add entry
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border/40 bg-card/30 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">New logistics entry</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Scheduled date
          </label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes or delivery instructions…"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add entry
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
