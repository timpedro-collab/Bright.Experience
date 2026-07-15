/** LogosStrip — client "trusted by" wall.
 *
 * Renders the client logos on a consistent dark panel so brand marks of any
 * colour (incl. white-only assets) read legibly regardless of the page theme,
 * mirroring the brand wall on bright.blue. Falls back to a monogram glyph when
 * no logo src is provided.
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

function LogoMark({ logo }: { logo: ClientLogo }) {
  if (logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        alt={logo.name}
        className={cn(
          "w-auto max-w-[8.5rem] object-contain opacity-70 brightness-0 invert transition-opacity duration-200 hover:opacity-100",
          logo.imgClassName ?? "h-8",
        )}
      />
    );
  }
  return (
    <span
      aria-label={logo.name}
      className="font-[var(--font-heading)] text-sm font-bold tracking-tight uppercase text-white/70 transition-opacity hover:text-white"
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
        <div className="bb-logo-marquee-group relative mt-6 overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,47%,8%)] py-8 motion-reduce:overflow-visible">
          {/* Edge fades — hidden when motion is reduced (static fallback). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[hsl(233,47%,8%)] to-transparent sm:w-24 motion-reduce:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[hsl(233,47%,8%)] to-transparent sm:w-24 motion-reduce:hidden"
          />

          <div className="bb-logo-marquee flex w-max motion-reduce:w-full">
            {/* Primary group — wraps + centres under reduced motion. */}
            <ul
              role="list"
              className="flex shrink-0 items-center gap-x-12 pr-12 sm:gap-x-16 sm:pr-16 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0"
            >
              {logos.map((logo) => (
                <li
                  key={logo.name}
                  className="flex h-11 shrink-0 items-center justify-center"
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
              className="flex shrink-0 items-center gap-x-12 pr-12 sm:gap-x-16 sm:pr-16 motion-reduce:hidden"
            >
              {logos.map((logo) => (
                <li
                  key={`${logo.name}-dup`}
                  className="flex h-11 shrink-0 items-center justify-center"
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
