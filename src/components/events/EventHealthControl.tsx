"use client";

/**
 * Internal-only control for flagging an event amber or red.
 *
 * The health dot drives the delivery queues ("events at risk") but nothing
 * could set it, so it never left green. Flagging takes a reason on purpose:
 * a red dot with no sentence behind it tells the next person nothing.
 *
 * Never rendered on the customer surface — the reason is internal commentary.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setEventHealth } from "@/app/actions/events";
import type { HealthStatus } from "@/types";

const FLAGS: { value: Exclude<HealthStatus, "green">; label: string }[] = [
  { value: "amber", label: "At risk" },
  { value: "red", label: "Blocked" },
];

export function EventHealthControl({
  eventId,
  status,
  reason,
}: {
  eventId: string;
  status: HealthStatus;
  reason?: string;
}) {
  const [draft, setDraft] = useState(reason ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(next: HealthStatus) {
    startTransition(async () => {
      const result = await setEventHealth({
        eventId,
        status: next,
        reason: next === "green" ? undefined : draft.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (next === "green") setDraft("");
      toast.success(
        next === "green" ? "Back on track." : "Flagged for the team."
      );
      router.refresh();
    });
  }

  const flagged = status !== "green";

  return (
    <div>
      {flagged ? (
        <p className="text-sm text-foreground">
          Flagged{" "}
          <span className="font-medium">
            {status === "red" ? "blocked" : "at risk"}
          </span>
          {reason ? ` — ${reason}` : ""}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          This event reads as on track. Flag it if it isn&apos;t.
        </p>
      )}

      <div className="mt-3 space-y-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="health-reason"
            className="text-overline text-muted-foreground"
          >
            What&apos;s wrong?
          </label>
          <input
            id="health-reason"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            placeholder="Artwork still not signed off"
            className="w-full rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FLAGS.map((flag) => (
            <Button
              key={flag.value}
              type="button"
              size="sm"
              variant={status === flag.value ? "default" : "outline"}
              disabled={pending}
              onClick={() => submit(flag.value)}
            >
              {pending && <Loader2 size={12} className="animate-spin" />}
              {flag.label}
            </Button>
          ))}
          {flagged && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => submit("green")}
            >
              Clear flag
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
