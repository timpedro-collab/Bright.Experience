/**
 * Internal control for posting a proof to the customer for sign-off.
 *
 * The counterpart to `ApprovalActions`: this is where an approval starts. The
 * proof is either an asset already uploaded against the event (the common case
 * — creative uploads the artwork, then sends it for sign-off) or an external
 * link for anything not yet in the portal.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestApproval } from "@/app/actions/approvals";
import {
  APPROVAL_TYPES,
  APPROVAL_TYPE_LABELS,
  type ApprovalType,
} from "@/lib/validations/approvals";
import { cn } from "@/lib/utils";

/** An event asset that can stand in as the proof. */
export interface ProofOption {
  id: string;
  name: string;
  /** Storage path or absolute URL, resolved back to a link on read. */
  path: string;
}

const selectClass =
  "h-9 w-full rounded-[var(--radius-control)] border border-border bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function RequestApprovalForm({
  eventId,
  proofOptions = [],
  className,
}: {
  eventId: string;
  /** Uploaded assets on this event, offered as the proof. */
  proofOptions?: ProofOption[];
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [approvalType, setApprovalType] = useState<ApprovalType>("wrap");
  const [description, setDescription] = useState("");
  const [proofId, setProofId] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // An external link only makes sense when no uploaded asset is chosen.
  const usingLink = proofId === "";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const previewUrl = usingLink
      ? linkUrl.trim()
      : proofOptions.find((option) => option.id === proofId)?.path ?? "";

    startTransition(async () => {
      const result = await requestApproval({
        eventId,
        title: title.trim(),
        approvalType,
        description: description.trim() || undefined,
        previewUrl: previewUrl || undefined,
      });

      if (!result.success) {
        toast.error("Couldn't post the proof", { description: result.error });
        return;
      }

      toast.success("Sent for sign-off", {
        description: "The customer has been notified and it's on their list.",
      });
      setTitle("");
      setDescription("");
      setProofId("");
      setLinkUrl("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="approval-title"
            className="text-overline text-muted-foreground"
          >
            What are they signing off?
          </label>
          <Input
            id="approval-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Machine wrap — final artwork"
            required
            minLength={3}
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="approval-type"
            className="text-overline text-muted-foreground"
          >
            Deliverable
          </label>
          <select
            id="approval-type"
            value={approvalType}
            onChange={(e) => setApprovalType(e.target.value as ApprovalType)}
            className={selectClass}
          >
            {APPROVAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {APPROVAL_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="approval-proof"
          className="text-overline text-muted-foreground"
        >
          Proof
        </label>
        <select
          id="approval-proof"
          value={proofId}
          onChange={(e) => setProofId(e.target.value)}
          className={selectClass}
        >
          <option value="">Link to something else</option>
          {proofOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {usingLink && (
          <Input
            aria-label="Proof link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://… (optional)"
            type="url"
            className="mt-1.5"
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="approval-note"
          className="text-overline text-muted-foreground"
        >
          Note for the customer (optional)
        </label>
        <textarea
          id="approval-note"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What changed since last time, or what to look at first."
          className="w-full resize-none rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" disabled={pending}>
          <Send size={14} />
          {pending ? "Sending…" : "Send for sign-off"}
        </Button>
        <p className="text-xs text-muted-foreground">
          They&apos;ll get an email and a portal notification straight away.
        </p>
      </div>
    </form>
  );
}
