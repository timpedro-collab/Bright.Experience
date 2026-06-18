"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOffQA } from "@/app/actions/qa";

/**
 * QA sign-off — the explicit, auditable confirmation that readiness is
 * complete. Only shown to QA/orchestration roles once every check is resolved;
 * it completes the QA task that gates the stage advance.
 */
export function QASignOffPanel({
  eventId,
  alreadySignedOff = false,
}: {
  eventId: string;
  alreadySignedOff?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOff() {
    startTransition(async () => {
      const result = await signOffQA(eventId);
      if (!result.success) {
        toast.error(result.error ?? "Could not sign off QA.");
        return;
      }
      toast.success("QA signed off. The build is cleared to advance.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {alreadySignedOff ? "QA signed off" : "Ready to sign off"}
          </p>
          <p className="text-xs text-muted-foreground">
            {alreadySignedOff
              ? "This build has been confirmed ready for delivery."
              : "Every check is resolved. Record the sign-off to clear the QA gate."}
          </p>
        </div>
      </div>
      <Button
        onClick={handleSignOff}
        disabled={pending || alreadySignedOff}
        variant="brand"
        size="sm"
        className="shrink-0"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {alreadySignedOff ? "Signed off" : "Sign off QA readiness"}
      </Button>
    </div>
  );
}
