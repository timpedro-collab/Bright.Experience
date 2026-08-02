"use client";

/**
 * Hydration-safe relative timestamp ("3h ago").
 *
 * `timeSince` depends on the wall clock and the machine's timezone, so a
 * server-rendered value (UTC on Vercel) can differ from what the browser
 * computes, which React reports as a hydration text mismatch (#418). This
 * component keeps the server's label for the initial paint (suppressing the
 * warning — the documented escape hatch for timestamps) and recomputes in
 * the user's own timezone once mounted.
 */
import { useEffect, useState } from "react";

import { timeSince } from "@/lib/dates";

export function TimeAgo({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState(() => timeSince(dateStr));

  useEffect(() => {
    setLabel(timeSince(dateStr));
  }, [dateStr]);

  return <span suppressHydrationWarning>{label}</span>;
}
