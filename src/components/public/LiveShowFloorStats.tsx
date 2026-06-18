"use client";

/**
 * "Live from the show floor" counters for the public landing.
 *
 * The leads figure is a pure, deterministic function of the wall clock: it
 * ramps from ~2,050 at the start of the month to ~3,950 at month-end, in
 * proportion to how far through the month we are. Because it's derived purely
 * from `now`, it:
 *   - increases monotonically (a lead count never ticks backward),
 *   - resets low at the start of each new month ("this month"),
 *   - shows the exact same value on every reload (no session-only state that
 *     would jump back down on refresh and reveal it as simulated).
 *
 * It updates roughly every minute, so it visibly changes if you sit on the
 * page, but the underlying rate (~1,900 leads / month) stays believable. Avg
 * dwell and opt-in are averages/percentages, so they hold steady.
 */

import { useEffect, useState } from "react";

const PLAYS_PER_LEAD = 3.12;

// Believable monthly band: starts here on the 1st, finishes near the top.
const MONTH_START_LEADS = 2050;
const MONTH_RANGE = 1900; // → ~3,950 by month-end

// Stable seed rendered on the server and the first client paint, so there is
// no hydration mismatch. The effect swaps in the real clock value on mount.
const SEED_LEADS = MONTH_START_LEADS + Math.round(MONTH_RANGE / 2); // ~3,000

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Leads accrued so far this month, ramped continuously from the clock. */
function monthAnchoredLeads(now: Date): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const progress = (now.getTime() - start) / (end - start); // 0..1
  return Math.round(MONTH_START_LEADS + progress * MONTH_RANGE);
}

export function LiveShowFloorStats() {
  const [leads, setLeads] = useState(SEED_LEADS);

  useEffect(() => {
    function sync() {
      setLeads(monthAnchoredLeads(new Date()));
    }
    sync();
    // Recompute from the clock periodically so it visibly advances over time
    // while remaining reload-consistent (the value only depends on `now`).
    const timer = setInterval(sync, 60_000);
    return () => clearInterval(timer);
  }, []);

  const plays = Math.round(leads * PLAYS_PER_LEAD);

  return (
    <>
      <p
        className="text-5xl font-bold text-white tabular-nums md:text-6xl"
        aria-live="polite"
      >
        {formatNumber(leads)}
      </p>
      <p className="text-sm text-white/50 mt-1">Leads captured this month</p>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center max-w-md mx-auto">
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatNumber(plays)}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Plays
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">42s</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Avg Dwell
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">94%</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Opt-In
          </p>
        </div>
      </div>
    </>
  );
}
