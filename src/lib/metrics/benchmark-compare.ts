/** Pure comparison helpers for event metrics vs prior events and venue-class benchmarks. */

export interface BenchmarkVerdict {
  metric: "plays" | "leads" | "dwell";
  label: string;
  value: number;
  reference: number;
  deltaPct: number;
  direction: "above" | "below" | "level";
  sentence: string;
}

const LEVEL_THRESHOLD = 5;

function deltaPct(value: number, reference: number): number {
  return Math.round(((value - reference) / reference) * 100);
}

function directionFor(delta: number): BenchmarkVerdict["direction"] {
  if (Math.abs(delta) < LEVEL_THRESHOLD) return "level";
  return delta > 0 ? "above" : "below";
}

function sentenceFor(
  direction: BenchmarkVerdict["direction"],
  delta: number,
  referenceLabel: string,
): string {
  if (direction === "level") return `Level with ${referenceLabel}`;
  const pct = Math.abs(delta);
  return direction === "above"
    ? `${pct}% above ${referenceLabel}`
    : `${pct}% below ${referenceLabel}`;
}

function buildVerdict(
  metric: BenchmarkVerdict["metric"],
  label: string,
  value: number,
  reference: number,
  referenceLabel: string,
): BenchmarkVerdict | null {
  if (reference === 0) return null;
  const delta = deltaPct(value, reference);
  const direction = directionFor(delta);
  return {
    metric,
    label,
    value,
    reference,
    deltaPct: delta,
    direction,
    sentence: sentenceFor(direction, delta, referenceLabel),
  };
}

/** Compare an event's totals against its own previous event (same account). */
export function compareToLastEvent(
  current: { plays: number; leads: number; dwellSeconds: number },
  previous: { plays: number; leads: number; dwellSeconds: number },
): BenchmarkVerdict[] {
  const specs: Array<{
    metric: BenchmarkVerdict["metric"];
    label: string;
    value: number;
    reference: number;
  }> = [
    { metric: "plays", label: "Plays", value: current.plays, reference: previous.plays },
    {
      metric: "leads",
      label: "Leads captured",
      value: current.leads,
      reference: previous.leads,
    },
    {
      metric: "dwell",
      label: "Avg dwell time",
      value: current.dwellSeconds,
      reference: previous.dwellSeconds,
    },
  ];

  return specs
    .map(({ metric, label, value, reference }) =>
      buildVerdict(metric, label, value, reference, "your last event"),
    )
    .filter((verdict): verdict is BenchmarkVerdict => verdict !== null);
}

/** Compare per-day rates against the venue-class median benchmark rows. */
export function compareToVenueClass(
  current: { playsPerDay: number; leadsPerDay: number },
  medians: { playsPerDay: number | null; leadsPerDay: number | null },
): BenchmarkVerdict[] {
  const specs: Array<{
    metric: BenchmarkVerdict["metric"];
    label: string;
    value: number;
    reference: number | null;
  }> = [
    {
      metric: "plays",
      label: "Plays",
      value: current.playsPerDay,
      reference: medians.playsPerDay,
    },
    {
      metric: "leads",
      label: "Leads captured",
      value: current.leadsPerDay,
      reference: medians.leadsPerDay,
    },
  ];

  return specs
    .filter((spec): spec is typeof spec & { reference: number } => spec.reference !== null)
    .map(({ metric, label, value, reference }) =>
      buildVerdict(metric, label, value, reference, "the venue-class median"),
    )
    .filter((verdict): verdict is BenchmarkVerdict => verdict !== null);
}
