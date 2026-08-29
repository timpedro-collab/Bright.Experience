/** LogosStrip — client "trusted by" wall.
 *
 * Each logo gets a per-asset treatment (design-language §6) so marks read
 * correctly in both Ink and Ink Light — full-colour logos sit on a literal
 * white chip; dark-ink marks use the same chip; white-only marks use a dark
 * chip. The strip itself uses semantic tokens, not a forced-dark panel.
 *
 * Motion: a seamless infinite marquee (two identical groups translated -50%).
 * Under `prefers-reduced-motion` the animation stops AND the layout collapses
 * to a static, centred, wrapped row (the duplicate group is hidden and the edge
 * fades removed) so nothing ever sits frozen under a fade gradient — the clip
 * bug that bit us before.
 *
 * Sizing: every mark renders at a single uniform height (`h-8`) with a width
 * cap, so the wall reads evenly. Several brand assets (Adyen, Red Bull,
 * Porsche, Celsius) are viewBox-only SVGs with no intrinsic pixel size; a
 * DEFINITE height (not a `max-h` cap) is required or they collapse to 0×0 and
 * vanish. Plain `<img>` is used (over next/image) for these tiny static marks.
 */
import { Container, Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { CLIENT_LOGOS, type ClientLogo } from "@/lib/marketing/client-logos";

interface LogosStripProps {
  logos?: ClientLogo[];
  overline?: string;
}

/**
 * Per-logo display treatment (design-language §6).
 * - `color` — full-colour mark; literal white chip preserves brand hues.
 * - `dark`  — dark ink on transparent; white chip so it reads on Ink.
 * - `light` — white/light mark on transparent; dark chip for Ink Light.
 */
type LogoTreatment = "color" | "dark" | "light";

const LOGO_TREATMENTS: Record<string, LogoTreatment> = {
  Storyblok: "dark", // #1F1F1F SVG — invisible on Ink without a chip
  Adyen: "color", // green wordmark — inversion would destroy brand colour
  "Red Bull": "light", // fill:#fff — invisible on Ink Light without a dark chip
  Pepsi: "light", // supplied PNG reads white-on-transparent — needs dark chip
  Porsche: "dark", // black paths, no fill — invisible on Ink
  Suntory: "color", // cyan logotype — full colour
  Lucozade: "color",
  Celsius: "dark", // black fill — invisible on Ink
  Pelion: "color",
  Intact: "color",
  "British Insurance Brokers' Association": "color",
};

function logoTreatment(logo: ClientLogo): LogoTreatment {
  return LOGO_TREATMENTS[logo.name] ?? "color";
}

function LogoMark({ logo }: { logo: ClientLogo }) {
  if (logo.src) {
    const treatment = logoTreatment(logo);
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-2",
          // Literal scrims/chips — photography-adjacent brand marks (§6).
          treatment === "light"
            ? "bg-black/75"
            : "bg-white/90",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt={logo.name}
          className={cn(
            "w-auto max-w-[8.5rem] object-contain opacity-80 transition-opacity duration-200 hover:opacity-100",
            logo.imgClassName ?? "h-8",
          )}
        />
      </span>
    );
  }
  return (
    <span
      aria-label={logo.name}
      className="font-[var(--font-heading)] text-sm font-bold tracking-tight uppercase text-muted-foreground transition-opacity hover:text-foreground"
    >
      {logo.name}
    </span>
  );
}

export function LogosStrip({
  logos = CLIENT_LOGOS,
  overline = "Trusted by",
}: LogosStripProps) {
  return (
    <Section spacing="md" className="border-t border-border/60">
      <Container>
        <p className="text-overline text-muted-foreground text-center">
          {overline}
        </p>
        <div className="bb-logo-marquee-group relative mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border bg-muted/30 py-8 motion-reduce:overflow-visible">
          {/* Edge fades — hidden when motion is reduced (static fallback). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-muted/30 to-transparent sm:w-24 motion-reduce:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-muted/30 to-transparent sm:w-24 motion-reduce:hidden"
          />

          <div className="bb-logo-marquee flex w-max motion-reduce:w-full">
            {/* Primary group — wraps + centres under reduced motion. */}
            <ul
              role="list"
              className="flex shrink-0 items-center gap-x-8 pr-8 sm:gap-x-12 sm:pr-12 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0"
            >
              {logos.map((logo) => (
                <li
                  key={logo.name}
                  className="flex shrink-0 items-center justify-center"
                  title={logo.name}
                >
                  <LogoMark logo={logo} />
                </li>
              ))}
            </ul>
            {/* Duplicate group — drives the seamless loop; removed when static. */}
            <ul
              role="list"
              aria-hidden
              className="flex shrink-0 items-center gap-x-8 pr-8 sm:gap-x-12 sm:pr-12 motion-reduce:hidden"
            >
              {logos.map((logo) => (
                <li
                  key={`${logo.name}-dup`}
                  className="flex shrink-0 items-center justify-center"
                >
                  <LogoMark logo={logo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
