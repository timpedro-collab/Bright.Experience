"use client";

/**
 * Push an inbound brand lead to an organizer as a pre-approved deal.
 *
 * The reverse half of deal registration: when a brand comes to us direct but
 * their audience lives at an organizer's show, we hand the conversation to
 * that channel already inside its 14-day window. Rendered on the internal
 * quote page so the decision happens where the lead is being read.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { pushLeadToOrganizer } from "@/app/actions/deal-registrations";

export interface OrganizerOption {
  id: string;
  name: string;
}

export function PushLeadCard({
  quoteId,
  companyName,
  organizers,
}: {
  quoteId: string;
  companyName: string;
  organizers: OrganizerOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [partnerId, setPartnerId] = useState("");

  if (organizers.length === 0) return null;

  function push() {
    if (!partnerId) {
      toast.error("Pick which organizer gets the lead.");
      return;
    }
    startTransition(async () => {
      const result = await pushLeadToOrganizer({ quoteId, partnerId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const name = organizers.find((o) => o.id === partnerId)?.name ?? "the organizer";
      toast.success(`${companyName} pushed to ${name} — their 14-day window is running`);
      setPartnerId("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-overline text-muted-foreground">Route to a channel</p>
        <p className="mt-1 text-sm text-muted-foreground">
          If this brand belongs at an organizer&apos;s show, push the lead to
          them as a pre-approved deal instead of selling it direct.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="push-lead-organizer">Organizer</Label>
          <NativeSelect
            id="push-lead-organizer"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
          >
            <option value="">Choose an organizer</option>
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={push}
          disabled={pending}
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Push lead
        </Button>
      </CardContent>
    </Card>
  );
}
