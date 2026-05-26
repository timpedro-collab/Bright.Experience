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

export const brightHeadings = localFont({
  src: "./bright-headings.ttf",
  variable: "--font-bright-headings",
  display: "swap",
  weight: "700",
  style: "normal",
  preload: true,
  fallback: ["Nunito", "system-ui", "sans-serif"],
});

export const brightBody = localFont({
  src: "./bright-body.ttf",
  variable: "--font-bright-body",
  display: "swap",
  weight: "400",
  style: "normal",
  preload: true,
  fallback: ["DM Sans", "system-ui", "sans-serif"],
});

export const brightOverline = localFont({
  src: "./bright-overline.ttf",
  variable: "--font-bright-overline",
  display: "swap",
  weight: "500",
  style: "normal",
  preload: true,
  fallback: ["DM Sans", "system-ui", "sans-serif"],
});

export const brandFontVariables = [
  brightHeadings.variable,
  brightBody.variable,
  brightOverline.variable,
].join(" ");
