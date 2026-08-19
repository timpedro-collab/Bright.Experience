/**
 * Scenario-quote document builder for partner pricing pages (`/pp/:slug`).
 *
 * Turns a configured Deal Explorer mix into a pdfmake document definition:
 * a one-page, Bright.Blue-branded scenario sheet the rep can download and
 * forward. Pure JSON in, pure JSON out — the pdfmake runtime is loaded
 * only in the browser by the download button, so this stays unit-testable
 * and out of the server bundle.
 *
 * Buyer-safe by construction: it renders only what the page already shows
 * (retail anchors, the split, floors, warnings). No internal economics.
 */

import type {
  Content,
  StyleDictionary,
  TDocumentDefinitions,
  TableCell,
} from "pdfmake/interfaces";

import {
  formatDealCurrency,
  type DealConfig,
  type DealConfigInputs,
  type DealConfigSummary,
} from "@/lib/deal-config";

/** Bright.Blue cobalt (see `--bb-cobalt` in globals.css). */
const BRAND_BLUE = "#183EF6";
const INK_MUTED = "#666666";
const RULE_GREY = "#cccccc";
const WARN_AMBER = "#92400E";

/** Everything the quote sheet needs, captured at download time. */
export interface DealQuoteContext {
  config: DealConfig;
  /** Effective inputs after the explorer's clamping — what's on screen. */
  inputs: DealConfigInputs;
  deal: DealConfigSummary;
  partnerName: string;
  /** Active preset label, or "Custom mix" when the rep dragged sliders. */
  scenarioLabel: string;
  /** Absolute link back to the live page with this mix encoded, if known. */
  pageUrl?: string;
  /** Date shown on the sheet; injectable so tests stay deterministic. */
  date?: Date;
}

interface QuoteLine {
  label: string;
  count: number;
  retail: number;
  total: number;
  isService: boolean;
}

/** The mix's non-zero lines, sponsorship first, service fees last. */
export function quoteLinesFor(
  config: DealConfig,
  inputs: DealConfigInputs,
): QuoteLine[] {
  const lines = config.levers
    .map((lever) => {
      const input = inputs[lever.key];
      const count = Math.max(0, Math.floor(input?.count ?? 0));
      const retail = input?.retail ?? lever.retail.suggested;
      return {
        label: lever.label,
        count,
        retail,
        total: count * retail,
        isService: lever.revenue === "service",
      };
    })
    .filter((line) => line.count > 0);
  return [...lines.filter((l) => !l.isService), ...lines.filter((l) => l.isService)];
}

/** "Bright.Blue-Informa-scenario-2026-08-19.pdf" — safe download name. */
export function quoteFileName(partnerName: string, date: Date = new Date()): string {
  const partner = partnerName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `Bright.Blue-${partner}-scenario-${date.toISOString().slice(0, 10)}.pdf`;
}

const th = (text: string): TableCell => ({ text, style: "tableHeader" });
const td = (text: string, alignment: "left" | "right" | "center" = "left"): TableCell => ({
  text,
  style: "tableCell",
  alignment,
});

/** Build the pdfmake document definition for one scenario. */
export function buildDealQuoteDoc(ctx: DealQuoteContext): TDocumentDefinitions {
  const { config, inputs, deal, partnerName, scenarioLabel } = ctx;
  const date = ctx.date ?? new Date();
  const currency = config.currency;
  const partnerPct = Math.round(config.split.partner * 100);
  const bbPct = Math.round(config.split.brightBlue * 100);
  const lines = quoteLinesFor(config, inputs);
  const money = (value: number) => formatDealCurrency(currency, value);

  const inventoryRows: TableCell[][] = lines.map((line) => [
    td(line.isService ? `${line.label} (flat service fee)` : line.label),
    td(String(line.count), "center"),
    td(money(line.retail), "right"),
    td(money(line.total), "right"),
  ]);

  const bottomLine: TableCell[][] = [
    [
      td("Gross sponsorship revenue (split-eligible sales)"),
      td(money(deal.gross), "right"),
    ],
    [
      td(`${partnerName} retains (${partnerPct}%)`),
      td(`+${money(deal.partnerKeeps)}`, "right"),
    ],
    ...lines
      .filter((line) => line.isService)
      .map((line): TableCell[] => [
        td(`${line.label} × ${line.count}, at ${money(line.retail)} per show`),
        td(`−${money(line.total)}`, "right"),
      ]),
    [
      { text: `Net to ${partnerName}`, style: "netLabel" },
      { text: money(deal.netToPartner), style: "netValue" },
    ],
  ];

  const warnings: Content[] = [];
  if (deal.belowPilotMinimum) {
    warnings.push({
      text:
        `Note: this mix sits below the pilot commitment of ` +
        `${config.commitment.pilotMinUnits}–${config.commitment.pilotMaxUnits} units.`,
      style: "warning",
    });
  }
  if (deal.floorGap > 0) {
    warnings.push({
      text:
        `Note: this mix sits ${money(deal.floorGap)} below the ${deal.tier.label} ` +
        `delivery floor of ${money(deal.tier.floor)} per machine, so as built it ` +
        `wouldn't fund its own delivery.`,
      style: "warning",
    });
  }

  const styles: StyleDictionary = {
    wordmark: { fontSize: 20, bold: true, color: BRAND_BLUE },
    date: { fontSize: 9, color: INK_MUTED, alignment: "right" },
    title: { fontSize: 15, bold: true, margin: [0, 18, 0, 2] },
    subtitle: { fontSize: 10, color: INK_MUTED, margin: [0, 0, 0, 14] },
    sectionHeader: { fontSize: 11, bold: true, margin: [0, 14, 0, 6] },
    tableHeader: {
      fontSize: 9,
      bold: true,
      color: "#ffffff",
      fillColor: BRAND_BLUE,
    },
    tableCell: { fontSize: 9 },
    statLabel: { fontSize: 8, color: INK_MUTED },
    statValue: { fontSize: 13, bold: true },
    netLabel: { fontSize: 10, bold: true },
    netValue: { fontSize: 10, bold: true, color: BRAND_BLUE, alignment: "right" },
    warning: { fontSize: 9, color: WARN_AMBER, margin: [0, 6, 0, 0] },
    terms: { fontSize: 8, color: INK_MUTED, margin: [0, 16, 0, 0] },
    link: { fontSize: 8, color: BRAND_BLUE, margin: [0, 6, 0, 0] },
  };

  return {
    pageSize: "A4",
    pageMargins: [40, 44, 40, 44],
    info: {
      title: `Bright.Blue × ${partnerName} — deal scenario`,
      author: "Bright.Blue",
    },
    content: [
      {
        columns: [
          { width: "*", text: "BRIGHT.BLUE", style: "wordmark" },
          { width: "auto", text: date.toLocaleDateString("en-US"), style: "date" },
        ],
      },
      { text: `Deal scenario — ${partnerName}`, style: "title" },
      {
        text: `${scenarioLabel} · ${deal.totalUnits} machines on the floor · ${deal.tier.label} tier`,
        style: "subtitle",
      },

      { text: "The inventory mix", style: "sectionHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [th("Line"), th("Count"), th("Price per item"), th("Line total")],
            ...inventoryRows,
          ],
        },
        layout: {
          hLineWidth: () => 0.3,
          vLineWidth: () => 0,
          hLineColor: () => RULE_GREY,
        },
      },

      { text: `Bottom line for ${partnerName}`, style: "sectionHeader" },
      {
        table: { widths: ["*", "auto"], body: bottomLine },
        layout: {
          hLineWidth: (i) => (i === bottomLine.length - 1 ? 0.6 : 0),
          vLineWidth: () => 0,
          hLineColor: () => "#000000",
        },
      },
      {
        text:
          `Of every sponsorship and ad-slot sale, ${partnerPct}% stays with ` +
          `${partnerName}; ${bbPct}% funds the delivery (machines, creative, crew, ` +
          `platform, reporting). Flat service fees are machines ${partnerName} buys ` +
          `for its own show numbers — a direct purchase, never split.`,
        style: "terms",
      },

      { text: "Where this mix lands", style: "sectionHeader" },
      {
        columns: [
          {
            stack: [
              { text: "Machines on the floor", style: "statLabel" },
              { text: String(deal.totalUnits), style: "statValue" },
            ],
          },
          {
            stack: [
              { text: "Volume tier", style: "statLabel" },
              { text: deal.tier.label, style: "statValue" },
            ],
          },
          {
            stack: [
              { text: "Per-unit delivery floor", style: "statLabel" },
              { text: money(deal.tier.floor), style: "statValue" },
            ],
          },
          {
            stack: [
              { text: `Retained per machine`, style: "statLabel" },
              { text: money(deal.partnerKeepsPerUnit), style: "statValue" },
            ],
          },
        ],
        columnGap: 12,
      },
      ...warnings,

      {
        text:
          `Suggested retail bands are exactly that: final pricing is ${partnerName}'s. ` +
          `In-building venue services (drayage, positioning, electrical, union labor ` +
          `where required) run on the organizer's general-service contract at organizer ` +
          `rates; everything up to the dock is carried by Bright.Blue. Volumes are ` +
          `committed ${config.commitment.cutoffWeeks} weeks before the show. This sheet ` +
          `is a working scenario, not a contract.`,
        style: "terms",
      },
      ...(ctx.pageUrl
        ? [
            {
              text: `Live version of this exact mix: ${ctx.pageUrl}`,
              style: "link",
            } satisfies Content,
          ]
        : []),
    ],
    styles,
  };
}
