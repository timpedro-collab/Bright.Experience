/**
 * In-app 15-minute walkthrough slot picker.
 *
 * Replaces the cold Calendly hand-off on the confirmation screen. The customer
 * picks a day + time inline; we record `walkthrough_scheduled_at` on the quote
 * so the booked meeting shows up in the event lead's portal (queue, quote
 * detail, and home focus). For the demo this is a self-contained scheduler — no
 * external calendar dependency.
 */
"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarCheck, Check, Clock } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { bookWalkthrough } from "@/app/actions/quotes";

/** Slot start times offered each day (24h). Each call is 15 minutes. */
const SLOT_TIMES: Array<{ h: number; m: number }> = [
  { h: 10, m: 0 },
  { h: 11, m: 30 },
  { h: 14, m: 0 },
  { h: 15, m: 30 },
  { h: 16, m: 30 },
];

const DAY_COUNT = 5;

interface DayOption {
  date: Date;
  label: string; // "Tue 24 Jun"
}

function nextWeekdays(count: number): DayOption[] {
  const out: DayOption[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Start from tomorrow so there's always lead time.
  cursor.setDate(cursor.getDate() + 1);
  while (out.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      out.push({
        date: new Date(cursor),
        label: cursor.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function formatTime(h: number, m: number): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface WalkthroughBookerProps {
  quoteId: string;
  aeFirstName: string;
  initialSlotLabel?: string | null;
}

export function WalkthroughBooker({
  quoteId,
  aeFirstName,
  initialSlotLabel,
}: WalkthroughBookerProps) {
  const days = useMemo(() => nextWeekdays(DAY_COUNT), []);
  const [activeDay, setActiveDay] = useState(0);
  const [confirmed, setConfirmed] = useState<string | null>(initialSlotLabel ?? null);
  const [pending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  function pick(day: DayOption, time: { h: number; m: number }) {
    const when = new Date(day.date);
    when.setHours(time.h, time.m, 0, 0);
    const slotLabel = `${day.label} · ${formatTime(time.h, time.m)}`;
    const key = when.toISOString();
    setPendingKey(key);
    startTransition(async () => {
      const result = await bookWalkthrough(quoteId, key, slotLabel);
      setPendingKey(null);
      if (result.success) {
        setConfirmed(slotLabel);
        toast.success("Walkthrough booked", {
          description: `${aeFirstName} will meet you on a video call at ${slotLabel}.`,
        });
      } else {
        toast.error("Couldn't book that slot", { description: result.error });
      }
    });
  }

  if (confirmed) {
    return (
      <div className="rounded-[var(--radius-card)] border border-success/30 bg-success/15 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
            <Check className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              You&apos;re booked for {confirmed}
            </p>
            {/* Honest promise: this picker records the slot but doesn't send
                calendar invites — the AE emails the call link by hand. */}
            <p className="mt-0.5 text-sm text-muted-foreground">
              {aeFirstName} will meet you then on a video call to walk through
              your tailored proposal, and email the final version straight
              after. {aeFirstName} will email you the call link ahead of time.
            </p>
            <button
              type="button"
              onClick={() => setConfirmed(null)}
              className="mt-2 text-xs text-primary underline-offset-4 hover:underline"
            >
              Pick a different time
            </button>
          </div>
        </div>
      </div>
    );
  }

  const day = days[activeDay];

  return (
    <div className="rounded-[var(--radius-card)] border border-primary/15 bg-primary/[0.04] p-5">
      <p className="inline-flex items-center gap-1.5 text-overline text-primary">
        <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
        Book your 15-minute walkthrough
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Choose a day">
        {days.map((d, i) => (
          <button
            key={d.label}
            type="button"
            role="tab"
            aria-selected={i === activeDay}
            onClick={() => setActiveDay(i)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              i === activeDay
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SLOT_TIMES.map((t) => {
          const when = new Date(day.date);
          when.setHours(t.h, t.m, 0, 0);
          const key = when.toISOString();
          const isPending = pending && pendingKey === key;
          return (
            <button
              key={`${t.h}-${t.m}`}
              type="button"
              disabled={pending}
              onClick={() => pick(day, t)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-background/60 px-3 py-2.5 text-sm font-medium text-foreground transition-colors",
                "hover:border-primary/50 hover:bg-primary/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {isPending ? "Booking…" : formatTime(t.h, t.m)}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        15 minutes · no obligation · video call
      </p>
    </div>
  );
}
