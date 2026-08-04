/**
 * Pure formatters for the public MCP server (/api/mcp) — turn canonical
 * catalog, pricing, and Bright Index data into the compact markdown an AI
 * assistant can quote to a buyer. No I/O here; the route injects the data.
 */
import {
  tiersForDisplay,
  formatTierBand,
  type PriceRegion,
} from "@/lib/pricing/tiers";
import type { IndexSection } from "@/lib/bright-index/shape";

export interface McpMachine {
  name: string;
  slug: string;
  tagline: string | null;
  capacityLabel: string | null;
  mechanisms: string[] | null;
}

/** Case-insensitive substring match across a machine's searchable text. */
export function machineMatchesQuery(machine: McpMachine, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    machine.name,
    machine.tagline ?? "",
    machine.capacityLabel ?? "",
    ...(machine.mechanisms ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** Markdown list of machines with the public detail-page path per machine. */
export function formatMachines(machines: McpMachine[]): string {
  if (machines.length === 0) {
    return "No machines matched. Try a broader query, or omit it to list the full range.";
  }
  const lines = machines.map((m) => {
    const detail = [
      m.tagline,
      m.capacityLabel ? `Capacity: ${m.capacityLabel}` : null,
      m.mechanisms?.length ? `Mechanisms: ${m.mechanisms.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return `- **${m.name}** (/catalog/machines/${m.slug})${detail ? ` — ${detail}` : ""}`;
  });
  return lines.join("\n");
}

/** Markdown pricing table for one region, from the canonical tier module. */
export function formatPricing(region: PriceRegion): string {
  const lines: string[] = [
    `Activation tiers (${region.toUpperCase()}, indicative bands for 1–3 day events):`,
    "",
  ];
  for (const tier of tiersForDisplay()) {
    lines.push(
      `- **${tier.displayName}** — ${formatTierBand(tier, region)}. ${tier.strapline}`
    );
  }
  lines.push("");
  lines.push(
    "Multi-week programs, tours, custom builds and premium residencies are quoted bespoke. A tailored proposal lands within 1 business day of intake."
  );
  return lines.join("\n");
}

/** Markdown rendering of the Bright Index sections (median + quartile band). */
export function formatBenchmarks(sections: IndexSection[]): string {
  if (sections.length === 0) {
    return "No published benchmarks yet — segments publish once they clear the sample floor. See /bright-index.";
  }
  const lines: string[] = [
    "The Bright Index — fleet benchmarks from completed events (medians, with the middle-50% band):",
  ];
  for (const section of sections) {
    lines.push("");
    lines.push(`## ${section.eventTypeLabel}`);
    for (const metric of section.metrics) {
      lines.push(`- ${metric.metricLabel}:`);
      for (const entry of metric.entries) {
        const band =
          entry.p25 !== null && entry.p75 !== null
            ? ` (middle 50%: ${Math.round(entry.p25)}–${Math.round(entry.p75)})`
            : "";
        lines.push(
          `  - ${entry.tierLabel}${entry.machineType ? ` · ${entry.machineType}` : ""}: median ${Math.round(entry.median)}${band}, n=${entry.sampleSize}`
        );
      }
    }
  }
  lines.push("");
  lines.push("Full methodology: /bright-index. Annual report: /state-of-play.");
  return lines.join("\n");
}
