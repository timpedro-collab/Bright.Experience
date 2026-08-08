/** Staged "labor illusion" transition shown between the final quiz answer and the result reveal. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** True when the visitor has asked the OS to reduce motion (SSR-safe). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STATUS_LINES = [
  "Matching machines to your brief…",
  "Checking fleet availability…",
  "Sizing your projected reach…",
] as const;

/** When each line's tick appears, in ms after mount. */
const LINE_COMPLETE_MS = [1400, 2800, 4200] as const;
/** Total duration before `onDone` fires — the final tick gets a beat on screen. */
const TOTAL_MS = 4500;

interface QuizWorkingTransitionProps {
  /** Called once, after the staged sequence completes (or immediately when skipped). */
  onDone: () => void;
  /** Force-skip the sequence. Reduced-motion visitors are skipped automatically. */
  skip?: boolean;
}

/**
 * Plays three sequential "working" status lines over ~4.5s, ticking each off
 * before handing back to the caller via `onDone`. Skipped entirely (immediate
 * `onDone`, nothing rendered) under `prefers-reduced-motion` or `skip`.
 */
export function QuizWorkingTransition({
  onDone,
  skip = false,
}: QuizWorkingTransitionProps) {
  // Decided once on mount so re-renders can never restart or cut the sequence.
  const [shouldSkip] = useState(() => skip || prefersReducedMotion());
  const [completedCount, setCompletedCount] = useState(0);

  // Keep the latest callback without making it a timer-effect dependency.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (shouldSkip) {
      onDoneRef.current();
      return;
    }
    const timers = LINE_COMPLETE_MS.map((ms, i) =>
      setTimeout(() => setCompletedCount(i + 1), ms)
    );
    timers.push(setTimeout(() => onDoneRef.current(), TOTAL_MS));
    return () => timers.forEach(clearTimeout);
  }, [shouldSkip]);

  if (shouldSkip) return null;

  return (
    <Card tone="subtle" className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-heading text-2xl font-semibold text-foreground md:text-3xl">
            Building your match
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One moment — we&apos;re lining everything up.
          </p>
        </div>

        <ul aria-live="polite" className="space-y-3">
          {STATUS_LINES.map((line, i) => {
            const isDone = i < completedCount;
            const isActive = i === completedCount;
            // Lines only appear once the previous one has ticked off.
            if (!isDone && !isActive) return null;
            return (
              <li
                key={line}
                className={cn(
                  "flex items-center gap-2.5 text-sm",
                  isDone && "text-muted-foreground",
                  isActive && "animate-pulse text-foreground"
                )}
              >
                <span
                  aria-hidden
                  className="flex h-5 w-5 shrink-0 items-center justify-center"
                >
                  {isDone ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                {line}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
