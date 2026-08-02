/**
 * Change-request panel shown when a briefing (or its logistics details) is
 * locked because the ops/studio team has already planned against it. Rather
 * than a dead-end read-only wall, the customer can describe what changed; we
 * post it to the event thread and notify the right internal owner.
 */
"use client";

import { useState, useTransition } from "react";
import { Loader2, PencilLine, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestBriefingChange } from "@/app/actions/briefing";

interface RequestChangePanelProps {
  eventId: string;
  formType: "creative" | "ops";
}

export function RequestChangePanel({ eventId, formType }: RequestChangePanelProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const areaLabel = formType === "ops" ? "logistics" : "creative";

  function handleSend() {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Add a quick note so the team knows what to change.");
      return;
    }
    startTransition(async () => {
      const result = await requestBriefingChange(eventId, formType, trimmed);
      if (result.success) {
        setSent(true);
        setNote("");
        toast.success("Change request sent", {
          description: "Your team has been notified and will confirm in Messages.",
        });
      } else {
        toast.error("Couldn't send your request", { description: result.error });
      }
    });
  }

  if (sent) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-control)] border border-success/30 bg-success/5 p-4">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-medium text-foreground">Change request sent</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ve let the team know. They&apos;ll confirm the change with you in
            Messages before it&apos;s actioned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--radius-control)] border border-border/60 bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">
        Locked for build — need to change something?
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Our team has started planning around these details, so they can&apos;t be
        edited directly. Tell us what needs to change and we&apos;ll confirm it with
        you.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="glass"
          className="mt-3 sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <PencilLine size={14} />
          Request a change
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <textarea
            aria-label={`Describe the ${areaLabel} change you need`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`What needs to change in your ${areaLabel} details?`}
            rows={3}
            className="w-full px-4 py-2.5 rounded-[var(--radius-control)] border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              className="sm:w-auto"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="brand"
              className="sm:ml-auto"
              onClick={handleSend}
              disabled={pending}
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {pending ? "Sending…" : "Send request"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
