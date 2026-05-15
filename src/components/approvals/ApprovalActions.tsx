/** Approve/reject controls for a single approval — with optimistic toasts and confetti */
"use client";

import { useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { decideApproval } from "@/app/actions/approvals";
import { celebrateFromElement } from "@/lib/celebrate";

export function ApprovalActions({
  approvalId,
  eventId,
}: {
  approvalId: string;
  eventId: string;
}) {
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [decided, setDecided] = useState<"approved" | "rejected" | null>(null);
  const approveRef = useRef<HTMLButtonElement | null>(null);

  async function handleDecision(decision: "approved" | "rejected") {
    if (decision === "rejected" && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    setLoading(decision);
    try {
      await decideApproval(approvalId, eventId, decision, feedback || undefined);
      setDecided(decision);
      if (decision === "approved") {
        toast.success("Approved", {
          description: "We'll let the team know straight away.",
        });
        celebrateFromElement(approveRef.current);
      } else {
        toast.info("Changes requested", {
          description: "Your feedback has been shared with the team.",
        });
      }
    } catch (err) {
      toast.error("Couldn't save your decision", {
        description:
          err instanceof Error
            ? err.message
            : "Please try again — if the issue persists, contact your producer.",
      });
    } finally {
      setLoading(null);
    }
  }

  if (decided) {
    return (
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
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
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
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
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button
          ref={approveRef}
          onClick={() => handleDecision("approved")}
          disabled={loading != null}
          variant="brand"
          className="flex-1"
        >
          {loading === "approved" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Approve
        </Button>
        <Button
          onClick={() => handleDecision("rejected")}
          disabled={loading != null}
          variant="outline"
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {loading === "rejected" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          {showFeedback ? "Submit changes" : "Request changes"}
        </Button>
      </div>
    </div>
  );
}
