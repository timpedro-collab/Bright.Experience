/**
 * Renders informa-sample-report.html to public/downloads/Bright.Blue-Informa-Sample-Report.pdf
 * using the Playwright screen-mode pipeline (never print-engine CSS): screen
 * media emulation at a 1080px viewport, scaled onto A4 with 10mm margins.
 *
 * Usage: node scripts/informa-report-pdf/generate.mjs
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "informa-sample-report.html");
const pdfPath = path.resolve(
  here,
  "../../public/downloads/Bright.Blue-Informa-Sample-Report.pdf"
);

const VIEWPORT_WIDTH = 1080;
const A4_W = 210;
const A4_H = 297;
const MARGIN = 10;
const SCALE = Math.min((A4_W - 2 * MARGIN) / (VIEWPORT_WIDTH * 0.264583), 1.0);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: VIEWPORT_WIDTH, height: 800 },
  deviceScaleFactor: 2,
});
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.emulateMedia({ media: "screen" });
await page.addStyleTag({
  content: `
    .page-break { page-break-before: auto; }
    .chart-card, .chart-row, .no-break, .kpi-grid, .three-col, table, .footer { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
  `,
});
await page.waitForTimeout(300);
await page.pdf({
  path: pdfPath,
  width: `${A4_W}mm`,
  height: `${A4_H}mm`,
  margin: { top: `${MARGIN}mm`, bottom: `${MARGIN}mm`, left: `${MARGIN}mm`, right: `${MARGIN}mm` },
  printBackground: true,
  displayHeaderFooter: false,
  scale: SCALE,
});
await browser.close();
console.log(`PDF saved: ${pdfPath}`);
