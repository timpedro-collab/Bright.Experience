/**
 * GET /llms.txt
 *
 * Serves structured product facts as markdown for AI crawlers and assistants
 * following the llms.txt convention.
 *
 * Expected caller: AI crawlers and assistants following the llms.txt convention.
 * Auth: none, public.
 * Payload: text/markdown body with product facts, pricing bands, capabilities,
 * proof stats, and key page paths.
 */
import { ALWAYS_ON, CAPABILITIES } from "@/lib/capabilities";
import { TRUST_STATS } from "@/lib/marketing/claims";
import {
  tiersForDisplay,
  formatTierBand,
  type PriceRegion,
} from "@/lib/pricing/tiers";

export const dynamic = "force-static";

const WHAT_IT_IS =
  "Bright.Blue supplies branded interactive vending and arcade machines for trade shows, exhibitions, festivals, retail and brand events — delivered, installed, run and measured end to end. Every activation captures structured engagement data; opted-in lead capture and a live telemetry dashboard are available by tier.";

const PRICING_CAVEAT =
  "Prices are indicative bands for standard 1–3 day event activations. Multi-week programs, tours, custom game builds and premium-location residencies are quoted bespoke. Other regions are priced on application.";

const KEY_PAGES: ReadonlyArray<{ path: string; description: string }> = [
  { path: "/pricing", description: "Activation tiers and what's included" },
  { path: "/catalog/machines", description: "The full machine range" },
  {
    path: "/catalog/case-studies",
    description: "Client case studies and proof points",
  },
  {
    path: "/quiz",
    description: "60-second match quiz with instant recommendation",
  },
  {
    path: "/proposal",
    description: "Request a tailored proposal (response within 1 business day)",
  },
  {
    path: "/how-it-works",
    description: "End-to-end delivery journey from brief to live activation",
  },
  {
    path: "/bright-index",
    description:
      "The Bright Index — published fleet benchmarks (median plays, leads and dwell per day, by venue class)",
  },
  {
    path: "/state-of-play",
    description:
      "State of Play — annual ungated report on measured brand activations",
  },
  {
    path: "/llm-info",
    description: "Structured product facts for people and AI assistants",
  },
];

const REGIONS: ReadonlyArray<{ key: PriceRegion; label: string }> = [
  { key: "uk", label: "UK" },
  { key: "us", label: "US" },
  { key: "eu", label: "EU" },
];

/** Build the llms.txt markdown body from canonical product modules. */
function buildBody(): string {
  const tiers = tiersForDisplay();
  const lines: string[] = [];

  lines.push("# Bright.Experience (Bright.Blue Events)");
  lines.push("");
  lines.push(WHAT_IT_IS);
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  for (const page of KEY_PAGES) {
    lines.push(`- ${page.path} — ${page.description}`);
  }
  lines.push("");
  lines.push("## Pricing (1–3 day activations)");
  lines.push("");
  lines.push(
    `| Tier | ${REGIONS.map((r) => r.label).join(" | ")} |`,
  );
  lines.push(
    `| --- | ${REGIONS.map(() => "---").join(" | ")} |`,
  );
  for (const tier of tiers) {
    const cells = REGIONS.map((r) => formatTierBand(tier, r.key));
    lines.push(`| ${tier.displayName} | ${cells.join(" | ")} |`);
  }
  lines.push("");
  lines.push(PRICING_CAVEAT);
  lines.push("");
  lines.push("## Included in every activation");
  lines.push("");
  for (const cap of ALWAYS_ON) {
    lines.push(`- ${cap.outcome}`);
  }
  lines.push("");
  lines.push("## Optional capabilities");
  lines.push("");
  for (const cap of CAPABILITIES) {
    lines.push(`- ${cap.outcome}`);
  }
  lines.push("");
  lines.push("## Proof");
  lines.push("");
  for (const stat of TRUST_STATS) {
    lines.push(`- ${stat.value} — ${stat.label}`);
  }
  lines.push("");
  lines.push("## MCP server (for AI assistants)");
  lines.push("");
  lines.push(
    "A public Model Context Protocol server is available at `/api/mcp` (streamable HTTP). Tools: `search_catalog`, `get_pricing`, `get_benchmarks`, `request_proposal`. No authentication required; the proposal tool creates a real sales enquiry, so only call it with the buyer's consent."
  );
  lines.push("");
  lines.push("## Contact");
  lines.push("");
  lines.push("hello@brightblue.com");

  return lines.join("\n");
}

/** Serve llms.txt markdown for AI crawlers and assistants. */
export function GET() {
  return new Response(buildBody(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
