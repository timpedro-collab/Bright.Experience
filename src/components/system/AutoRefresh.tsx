/**
 * Silently re-fetches the server-rendered content of the current route on an
 * interval so collaborative surfaces reflect other people's writes without a
 * manual refresh. Uses `router.refresh()`, which re-renders server components
 * and re-runs data fetching while preserving client component state (e.g. an
 * in-progress message draft is not lost).
 *
 * To conserve resources it pauses while the tab is hidden and only catches up
 * on refocus when the data is older than one interval.
 */
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Poll interval in milliseconds. Defaults to 20s. */
  intervalMs?: number;
}

export function AutoRefresh({ intervalMs = 20_000 }: AutoRefreshProps) {
  const router = useRouter();
  // Initialised to 0 (not Date.now()) so render stays pure; the effect stamps
  // the real mount time below.
  const lastRefreshed = useRef(0);

  useEffect(() => {
    lastRefreshed.current = Date.now();

    function refresh() {
      router.refresh();
      lastRefreshed.current = Date.now();
    }

    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);

    function onVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefreshed.current > intervalMs
      ) {
        refresh();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, router]);

  return null;
}
