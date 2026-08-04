/**
 * POST /api/mcp — the public Bright.Experience MCP server.
 *
 * Expected caller: AI assistants (Claude, ChatGPT, Cursor, etc.) speaking the
 * Model Context Protocol over streamable HTTP. Auth: none — every tool exposes
 * only data that is already public on the marketing site (catalog, pricing
 * bands, Bright Index aggregates), and the one write tool (`request_proposal`)
 * funnels into the same rate-limited, validated intake as the public /proposal
 * wizard. Payload: MCP JSON-RPC; connect clients to `<origin>/api/mcp`.
 *
 * Precedent: Hire Space and RainFocus ship MCP servers so venue/catalog search
 * happens inside the assistant (docs/19 §event-tech). Advertised in /llms.txt.
 */
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { getMachines } from "@/lib/queries/machines";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import { shapeIndex } from "@/lib/bright-index/shape";
import { submitProposalIntake } from "@/app/actions/quotes/proposal-intake";
import {
  formatMachines,
  formatPricing,
  formatBenchmarks,
  machineMatchesQuery,
  type McpMachine,
} from "@/lib/mcp/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_catalog",
      {
        title: "Search the machine catalog",
        description:
          "List Bright.Experience's branded interactive machines (arcade, vending, claw and hybrid formats). Optional free-text query filters by name, tagline, capacity or mechanism.",
        inputSchema: z.object({
          query: z
            .string()
            .max(120)
            .optional()
            .describe("Free-text filter, e.g. 'claw', 'sampling', 'arcade'"),
        }),
      },
      async ({ query }) => {
        const rows = await getMachines();
        const machines: McpMachine[] = rows.map(
          (m: {
            name: string;
            slug: string;
            tagline: string | null;
            capacity_label: string | null;
            mechanisms: string[] | null;
          }) => ({
            name: m.name,
            slug: m.slug,
            tagline: m.tagline,
            capacityLabel: m.capacity_label,
            mechanisms: m.mechanisms,
          })
        );
        const matched = query
          ? machines.filter((m) => machineMatchesQuery(m, query))
          : machines;
        return text(formatMachines(matched));
      }
    );

    server.registerTool(
      "get_pricing",
      {
        title: "Get activation pricing tiers",
        description:
          "Indicative price bands for a full-service machine activation (1–3 day events) by region, from the canonical public pricing model.",
        inputSchema: z.object({
          region: z
            .enum(["uk", "us", "eu"])
            .default("uk")
            .describe("Pricing region"),
        }),
      },
      async ({ region }) => text(formatPricing(region))
    );

    server.registerTool(
      "get_benchmarks",
      {
        title: "Get the Bright Index benchmarks",
        description:
          "Published fleet benchmarks from completed events: median plays, opted-in leads and dwell per event day, by venue class, with quartile bands and sample sizes. Aggregates only.",
        inputSchema: z.object({}),
      },
      async () => {
        const rows = await getPublicBenchmarks();
        return text(formatBenchmarks(shapeIndex(rows)));
      }
    );

    server.registerTool(
      "request_proposal",
      {
        title: "Request a tailored proposal",
        description:
          "Submit an activation brief on behalf of a buyer. Bright.Experience responds with a tailored proposal within 1 business day. Only submit with the buyer's explicit consent — this creates a real sales enquiry.",
        inputSchema: z.object({
          eventType: z
            .string()
            .min(1)
            .describe(
              "Kind of event, e.g. 'activation', 'sampling', 'conference', 'exhibition', 'festival'"
            ),
          contactName: z.string().min(2).describe("Buyer's full name"),
          contactEmail: z.string().email().describe("Buyer's work email"),
          companyName: z.string().optional().describe("Buyer's company"),
          venueName: z.string().optional().describe("Venue or show name"),
          eventDateStart: z
            .string()
            .optional()
            .describe("Event start date, ISO format (YYYY-MM-DD)"),
          eventDateEnd: z
            .string()
            .optional()
            .describe("Event end date, ISO format (YYYY-MM-DD)"),
          objective: z
            .string()
            .max(2000)
            .optional()
            .describe("What success looks like — leads, footfall, launch buzz"),
          footfallEstimate: z
            .string()
            .optional()
            .describe("Expected footfall, free text, e.g. '20,000 over 3 days'"),
          specialRequirements: z.string().max(2000).optional(),
        }),
      },
      async (input) => {
        // Same validated, rate-limited path as the public wizard — the action
        // enforces quoteLimiter(ip) and field validation internally.
        const result = await submitProposalIntake({
          eventType: input.eventType,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          companyName: input.companyName,
          venueName: input.venueName,
          eventDateStart: input.eventDateStart,
          eventDateEnd: input.eventDateEnd,
          objective: input.objective,
          footfallEstimate: input.footfallEstimate,
          specialRequirements: input.specialRequirements,
          engagementScope: "Submitted via MCP assistant",
        });

        if (!result.success) {
          return text(`The enquiry could not be submitted: ${result.error}`);
        }

        return text(
          [
            `Proposal request received (reference ${result.data.id}).`,
            "Bright.Experience will reply to the contact email with a tailored proposal within 1 business day.",
            result.data.estimate
              ? "An instant estimate was generated and will be included in the follow-up."
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        );
      }
    );
  },
  {
    serverInfo: { name: "bright-experience", version: "1.0.0" },
    instructions:
      "Bright.Experience supplies branded interactive machine activations (arcade, vending, claw) for events — delivered, run and measured end to end. Use search_catalog and get_pricing to answer buying questions, get_benchmarks for published performance data, and request_proposal (with the buyer's consent) to start a real enquiry.",
  }
);

export { handler as GET, handler as POST, handler as DELETE };
