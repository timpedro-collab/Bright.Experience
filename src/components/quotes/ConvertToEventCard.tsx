"use client";

/**
 * Internal control for turning a quote into a live event workspace.
 *
 * Auto-provisioning is off by default (`BOOKING_AUTO_PROVISION`), so a booking
 * or an accepted proposal used to sit in the queue with nothing behind it and
 * no way forward without database access. This is that step, done deliberately:
 * it creates the customer account, the event workspace with its full delivery
 * runway, and the customer's invite.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertQuoteToEvent } from "@/app/actions/quotes";

/** Statuses the action will act on — mirrored here to explain the block. */
const CONVERTIBLE = ["submitted", "proposal_sent", "accepted"];

export function ConvertToEventCard({
  quoteId,
  status,
  eventId,
  contactName,
}: {
  quoteId: string;
  status: string;
  /** Set once the quote has an event behind it. */
  eventId: string | null;
  contactName: string;
}) {
  const [converted, setConverted] = useState(eventId);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function convert() {
    startTransition(async () => {
      const result = await convertQuoteToEvent(quoteId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setConverted(result.data.eventId);
      toast.success(
        result.data.alreadyConverted
          ? "This quote already had an event."
          : "Event workspace created."
      );
      router.refresh();
    });
  }

  return (
    <Card tone="subtle" className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Rocket size={15} className="text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">
          Event workspace
        </h3>
      </div>

      {converted ? (
        <>
          <p className="text-sm text-muted-foreground">
            This quote is live. Delivery happens in the event workspace from
            here.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${converted}`}>
              Open the event <ArrowRight size={14} />
            </Link>
          </Button>
        </>
      ) : CONVERTIBLE.includes(status) ? (
        <>
          <p className="text-sm text-muted-foreground">
            Creates {contactName}&apos;s account, an event workspace with its
            milestones, tasks and asset checklist, and emails them an invite. Do
            it once you&apos;ve confirmed the dates are ours.
          </p>
          <Button variant="brand" size="sm" disabled={pending} onClick={convert}>
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
            {pending ? "Creating…" : "Create the event workspace"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing to build yet — a {status.replace(/_/g, " ")} quote has no
          agreed booking behind it.
        </p>
      )}
    </Card>
  );
}
