/**
 * Approve/reject controls for a single approval.
 *
 * Truly optimistic: the decision registers on screen the instant the button
 * is pressed (confetti included), while the server action resolves in the
 * background. On failure the controls come back with an error toast.
 */
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { decideApproval } from "@/app/actions/approvals";
import { celebrateFromElement } from "@/lib/celebrate";

export function ApprovalActions({
  approvalId,
  eventId,
  onBehalf = false,
}: {
  approvalId: string;
  eventId: string;
  /** Internal staff recording the decision on the customer's behalf. */
  onBehalf?: boolean;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [decided, setDecided] = useState<"approved" | "rejected" | null>(null);
  const [, startTransition] = useTransition();
  const approveRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  function handleDecision(decision: "approved" | "rejected") {
    if (decision === "rejected" && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    // Optimistic: the decision (and celebration) lands immediately.
    // Confetti fires before the re-render removes the button element.
    if (decision === "approved") celebrateFromElement(approveRef.current);
    setDecided(decision);
    if (decision === "approved") {
      toast.success(onBehalf ? "Recorded on the customer's behalf" : "Approved", {
        description: onBehalf
          ? "Logged against your name in the activity trail."
          : "We'll let the team know straight away.",
      });
    } else {
      toast.info("Changes requested", {
        description: onBehalf
          ? "Logged on the customer's behalf and shared with the team."
          : "Your feedback has been shared with the team.",
      });
    }

    startTransition(async () => {
      const result = await decideApproval(
        approvalId,
        eventId,
        decision,
        feedback || undefined,
        onBehalf,
      );
      if (!result.success) {
        // Bring the controls back so the user can retry.
        setDecided(null);
        toast.error("Couldn't save the decision", {
          description: result.error,
        });
        return;
      }
      router.refresh();
    });
  }

  if (decided) {
    return (
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
        {decided === "approved" ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={16} />
            Approved
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-warning">
            <XCircle size={16} />
            Changes requested
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      {onBehalf && (
        <p className="mb-3 text-xs text-muted-foreground leading-snug max-w-[42ch]">
          Only record a decision if the customer has asked you to sign off on
          their behalf — it&apos;s logged against your name.
        </p>
      )}
      {showFeedback && (
        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <MessageSquare size={12} />
            Feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What changes are needed?"
            rows={3}
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button
          ref={approveRef}
          onClick={() => handleDecision("approved")}
          variant="brand"
          className="flex-1"
        >
          <CheckCircle2 size={14} />
          {onBehalf ? "Approve for customer" : "Approve"}
        </Button>
        <Button
          onClick={() => handleDecision("rejected")}
          variant="outline"
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <XCircle size={14} />
          {showFeedback
            ? "Submit changes"
            : onBehalf
              ? "Request changes for customer"
              : "Request changes"}
        </Button>
      </div>
    </div>
  );
}
