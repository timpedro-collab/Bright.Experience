/**
 * Bright.Blue brand fonts — loaded locally via next/font/local.
 *
 * These three TTFs are the *actual* brand fonts (identified from file metadata):
 *   - headings : Nunito Bold              (weight 700, humanist sans, rounded terminals)
 *   - body     : DM Sans Regular          (weight 400, modern geometric sans)
 *   - overline : DM Sans Medium           (weight 500, used for tracked uppercase eyebrows)
 *
 * The brand intentionally uses DM Sans (not a monospace) for overlines —
 * "overline" here means the tracked-uppercase eyebrow treatment, not a
 * mono-spaced font. The codebase previously referenced JetBrains Mono /
 * Inter / Plus Jakarta Sans incorrectly; this file is the source of truth.
 *
 * Each font exposes a CSS custom property (e.g. `--font-bright-headings`)
 * that is wired into `globals.css` via the `--font-heading`, `--font-body`,
 * `--font-overline` tokens so every consumer keeps working unchanged.
 */
import localFont from "next/font/local";

const brightHeadings = localFont({
  src: "./bright-headings.ttf",
  variable: "--font-bright-headings",
  display: "swap",
  weight: "700",
  style: "normal",
  preload: true,
  fallback: ["Nunito", "system-ui", "sans-serif"],
});

const brightBody = localFont({
  src: "./bright-body.ttf",
  variable: "--font-bright-body",
  display: "swap",
  weight: "400",
  style: "normal",
  preload: true,
  fallback: ["DM Sans", "system-ui", "sans-serif"],
});

const brightOverline = localFont({
  src: "./bright-overline.ttf",
  variable: "--font-bright-overline",
  display: "swap",
  weight: "500",
  style: "normal",
  preload: true,
  fallback: ["DM Sans", "system-ui", "sans-serif"],
});

/**
 * Display face — Clash Display (variable: wght 200–700), Fontshare Free Font
 * License (see ./LICENSE-clash-display.txt). Used ONLY on public marketing
 * surfaces (hero h1, section h2, pull-quotes) — the portal stays entirely on
 * Nunito/DM Sans. Replaced the Fraunces serif 2026-08: an assertive modern
 * display grotesk matches the cutting-edge positioning better than an
 * editorial serif. Not preloaded — it must not cost the logged-in portal
 * anything.
 */
const brightDisplay = localFont({
  src: "./bright-display.ttf",
  variable: "--font-bright-display",
  display: "swap",
  weight: "200 700",
  style: "normal",
  preload: false,
  fallback: ["Space Grotesk", "system-ui", "sans-serif"],
});

export const brandFontVariables = [
  brightHeadings.variable,
  brightBody.variable,
  brightOverline.variable,
  brightDisplay.variable,
].join(" ");
