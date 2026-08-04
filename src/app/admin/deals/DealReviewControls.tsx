"use client";

/**
 * Approve / reject controls for one pending deal registration.
 *
 * Approval starts the 14-day exclusivity clock immediately, so the buttons
 * are one click; rejection asks for a reason because the organizer reads it
 * verbatim in their portal.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveDealRegistration,
  rejectDealRegistration,
} from "@/app/actions/deal-registrations";

export function DealReviewControls({
  registrationId,
  sponsorCompany,
}: {
  registrationId: string;
  sponsorCompany: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function approve() {
    startTransition(async () => {
      const result = await approveDealRegistration(registrationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${sponsorCompany} registered — 14-day window started`);
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) {
      toast.error("Give the organizer a reason they can read.");
      return;
    }
    startTransition(async () => {
      const result = await rejectDealRegistration(registrationId, reason.trim());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Registration rejected");
      setRejecting(false);
      setReason("");
      router.refresh();
    });
  }

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why not? The organizer reads this."
          maxLength={500}
          className="h-8 w-64 text-xs"
          aria-label="Rejection reason"
        />
        <Button variant="destructive" size="sm" onClick={reject} disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Reject
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setRejecting(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="brand" size="sm" onClick={approve} disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRejecting(true)}
        disabled={pending}
      >
        <X size={14} />
        Reject
      </Button>
    </div>
  );
}
