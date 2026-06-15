"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

const MESSAGES_EARLY = [
  "Great start — keep going!",
  "Momentum building!",
  "Off to a strong start.",
];

const MESSAGES_MID = [
  "Halfway there — pushing through!",
  "Solid progress. Keep it up!",
  "Over the hump!",
];

const MESSAGES_LATE = [
  "Almost there — just a couple left!",
  "Nearly done. The finish line is close!",
  "So close! Don't stop now.",
];

const MESSAGES_DONE = [
  "All done! Beautiful work.",
  "Everything checked off. Incredible.",
  "Queue cleared. You crushed it.",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMessage(done: number, total: number): string {
  if (done >= total) return pick(MESSAGES_DONE);
  const pct = done / total;
  if (pct >= 0.75) return pick(MESSAGES_LATE);
  if (pct >= 0.4) return pick(MESSAGES_MID);
  return pick(MESSAGES_EARLY);
}

export function useProgressToast(label: string) {
  const lastRef = useRef(0);

  const showProgress = useCallback(
    (completed: number, total: number) => {
      if (total <= 0) return;
      const now = Date.now();
      if (now - lastRef.current < 600) return;
      lastRef.current = now;

      const pct = Math.min(Math.round((completed / total) * 100), 100);
      const msg = getMessage(completed, total);
      const isDone = completed >= total;

      toast(msg, {
        description: isDone
          ? `All ${total} ${label} complete`
          : `${completed} of ${total} ${label} — ${pct}%`,
        duration: isDone ? 4000 : 2500,
        icon: isDone ? "🎉" : undefined,
      });
    },
    [label]
  );

  return { showProgress };
}
