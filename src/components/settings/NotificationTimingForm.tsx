"use client";

/**
 * Digest timing controls — timezone, the local hour the daily digest is sent,
 * and a quiet-hours window. Persisted via `updateNotificationTiming`. The
 * hourly digest cron reads these so each recipient is emailed at their own
 * local time, never during quiet hours.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateNotificationTiming } from "@/app/actions/notifications";

export interface NotificationTimingValue {
  timezone: string;
  digestHour: number;
  quietStartHour: number;
  quietEndHour: number;
}

interface Props {
  initial: NotificationTimingValue;
}

const TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Prague",
  "Europe/Madrid",
  "Asia/Dubai",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

function hourLabel(h: number): string {
  const suffix = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

const selectClass =
  "w-full bg-card text-foreground px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition text-sm";

export function NotificationTimingForm({ initial }: Props) {
  const browserTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const timezones = Array.from(
    new Set([initial.timezone, browserTz, ...TIMEZONES].filter(Boolean)),
  ) as string[];

  const [timezone, setTimezone] = useState(initial.timezone);
  const [digestHour, setDigestHour] = useState(initial.digestHour);
  const [quietStartHour, setQuietStartHour] = useState(initial.quietStartHour);
  const [quietEndHour, setQuietEndHour] = useState(initial.quietEndHour);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationTiming({
        timezone,
        digestHour,
        quietStartHour,
        quietEndHour,
      });
      if (result.success) {
        toast.success("Digest timing saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  const quietDisabled = quietStartHour === quietEndHour;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Digest delivery time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="tz">Your timezone</Label>
          <select
            id="tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={selectClass}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="digest-hour">Send my daily digest at</Label>
          <select
            id="digest-hour"
            value={digestHour}
            onChange={(e) => setDigestHour(Number(e.target.value))}
            className={selectClass}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quiet-start">Quiet hours from</Label>
            <select
              id="quiet-start"
              value={quietStartHour}
              onChange={(e) => setQuietStartHour(Number(e.target.value))}
              className={selectClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiet-end">until</Label>
            <select
              id="quiet-end"
              value={quietEndHour}
              onChange={(e) => setQuietEndHour(Number(e.target.value))}
              className={selectClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {quietDisabled
            ? "Quiet hours are off (set different start and end times to enable)."
            : `We won't email you between ${hourLabel(quietStartHour)} and ${hourLabel(quietEndHour)} your local time.`}
        </p>

        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save timing"}
        </Button>
      </CardContent>
    </Card>
  );
}
