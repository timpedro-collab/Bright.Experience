"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Debounces a polled status value: the returned status only changes after the
 * input has held the same new value for `stablePolls` consecutive updates —
 * prevents live dashboards strobing between states on noisy metrics
 * (docs/18-design-research.md R6).
 */
export function useStableStatus<T>(current: T, stablePolls = 2): T {
  const [displayed, setDisplayed] = useState(current);
  const streakRef = useRef(0);
  const candidateRef = useRef<T | null>(null);
  const skipNextEffectRef = useRef(false);

  // Runs after every parent poll (including when `current` is unchanged).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce tracks poll commits, not just value changes (R6)
  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }

    if (Object.is(current, displayed)) {
      streakRef.current = 0;
      candidateRef.current = null;
      return;
    }

    if (Object.is(candidateRef.current, current)) {
      streakRef.current += 1;
    } else {
      candidateRef.current = current;
      streakRef.current = 1;
    }

    if (streakRef.current >= stablePolls) {
      skipNextEffectRef.current = true;
      setDisplayed(current);
      streakRef.current = 0;
      candidateRef.current = null;
    }
  });

  return displayed;
}
