/** Public advertiser-facing board: browse open ad slots and request one. */
"use client";

import { useState, useTransition } from "react";
import { Calendar, MapPin, Monitor, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { requestVenueSlot } from "@/app/actions/venues";
import { formatUSDFromCents } from "@/lib/currency";
import { formatDateMedium } from "@/lib/dates";

export interface AdvertiseSlot {
  id: string;
  unitName: string;
  format?: string;
  locationNote?: string;
  startDate: string;
  endDate: string;
  price?: number;
}

function RequestForm({
  slotId,
  onDone,
}: {
  slotId: string;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestVenueSlot(slotId, {
        company,
        contactName,
        email,
        message,
      });
      if (res.success) onDone();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border/50 pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`co-${slotId}`}>Company</Label>
          <Input
            id={`co-${slotId}`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Your brand or agency"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`name-${slotId}`}>Contact name</Label>
          <Input
            id={`name-${slotId}`}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Full name"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`email-${slotId}`}>Work email</Label>
        <Input
          id={`email-${slotId}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`msg-${slotId}`}>Anything we should know? (optional)</Label>
        <textarea
          id={`msg-${slotId}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Campaign, creative, flexible dates…"
          className="w-full rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !company || !email}>
          {isPending ? "Sending…" : "Send request"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SlotCard({ slot }: { slot: AdvertiseSlot }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Card interactive>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{slot.unitName}</p>
            {slot.format && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Monitor size={11} /> {slot.format}
              </p>
            )}
          </div>
          {slot.price != null && (
            <div className="text-right">
              <p className="text-sm font-bold text-brand">
                {formatUSDFromCents(slot.price)}
              </p>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                per week
              </p>
            </div>
          )}
        </div>

        {slot.locationNote && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} className="mt-0.5 shrink-0" /> {slot.locationNote}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>
            {formatDateMedium(slot.startDate)} — {formatDateMedium(slot.endDate)}
          </span>
        </div>

        {done ? (
          <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 size={15} />
            Request sent — the team will be in touch.
          </div>
        ) : open ? (
          <RequestForm slotId={slot.id} onDone={() => setDone(true)} />
        ) : (
          <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
            Request this slot
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function VenueAdvertiseBoard({ slots }: { slots: AdvertiseSlot[] }) {
  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Badge variant="muted" className="mb-3">
            Fully booked
          </Badge>
          <p className="text-sm text-muted-foreground">
            Every slot is currently spoken for — get in touch and we&apos;ll let
            you know the moment space opens up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <SlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
