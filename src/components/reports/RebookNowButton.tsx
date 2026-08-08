/** One-click rebook for signed-in customers — fires the pre-filled quote action. */
"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createRebookQuote } from "@/app/actions/quotes/rebook";

export function RebookNowButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <div
        className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/[0.07] px-4 py-3 text-sm text-foreground"
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        <span>
          Rebook started — we&apos;ve pre-filled your configuration and your
          account manager will confirm dates with you shortly.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="brand"
        className="w-full group"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await createRebookQuote(eventId);
            setState(result.success ? "done" : "error");
          })
        }
      >
        {isPending ? "Starting your rebook…" : "Rebook this activation"}
        {!isPending && (
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        )}
      </Button>
      {state === "error" && (
        <p className="text-xs text-destructive" role="alert">
          Something went wrong — please try again or message your team.
        </p>
      )}
    </div>
  );
}
