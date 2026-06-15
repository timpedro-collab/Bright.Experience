/**
 * Server-side PDF generation via Puppeteer.
 *
 * Navigates headless Chrome to a print-optimised page route,
 * waits for Recharts SVGs to render, then captures a PDF.
 *
 * INTEGRATION: Puppeteer
 * In production on Vercel, uses @sparticuz/chromium for the binary.
 * Locally, falls back to the system Chrome installation.
 */

let puppeteer: typeof import("puppeteer-core") | null = null;

async function getPuppeteer() {
  if (!puppeteer) {
    puppeteer = await import("puppeteer-core");
  }
  return puppeteer;
}

async function getBrowser() {
  const pup = await getPuppeteer();

  // In production (Vercel serverless), use @sparticuz/chromium
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = await import("@sparticuz/chromium").then((m) => m.default);
    return pup.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local development — use system Chrome
  const possiblePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const p of possiblePaths) {
    try {
      const fs = await import("fs");
      if (fs.existsSync(p)) {
        return pup.launch({ executablePath: p, headless: true });
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    "No Chrome binary found. Install Google Chrome or set up @sparticuz/chromium.",
  );
}

interface PdfOptions {
  /** Full URL of the print-optimised page to capture. */
  url: string;
  /** Cookies to forward for auth (session tokens). */
  cookies?: Array<{ name: string; value: string; domain: string }>;
  /** A4 portrait or landscape. Defaults to portrait. */
  landscape?: boolean;
  /** Wait for this selector before capturing (e.g. ".recharts-wrapper"). */
  waitForSelector?: string;
}

/**
 * Generate a PDF buffer from a print-optimised page.
 *
 * Opens a headless browser, navigates to the given URL,
 * waits for content to render (including charts), and
 * produces a PDF with proper page sizing and colour.
 */
export async function generatePdf(options: PdfOptions): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    if (options.cookies?.length) {
      await page.setCookie(...options.cookies);
    }

    await page.goto(options.url, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10_000 }).catch(() => {
        // Selector not found — proceed anyway (chart may not exist for this report)
      });
    }

    // Extra settle time for Recharts animations to complete
    await new Promise((r) => setTimeout(r, 1500));

    const pdf = await page.pdf({
      format: "A4",
      landscape: options.landscape ?? false,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
