/** LogosStrip — client "trusted by" wall.
 *
 * Renders the client logos on a consistent dark panel so brand marks of any
 * colour (incl. white-only assets) read legibly regardless of the page theme,
 * mirroring the brand wall on bright.blue. Falls back to a monogram glyph when
 * no logo src is provided.
 */
import Image from "next/image";

import { Container, Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { CLIENT_LOGOS, type ClientLogo } from "@/lib/marketing/client-logos";

interface LogosStripProps {
  logos?: ClientLogo[];
  overline?: string;
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
        <div className="bb-logo-marquee-group group relative mt-6 overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,47%,8%)] py-8">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[hsl(233,47%,8%)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[hsl(233,47%,8%)] to-transparent" />
          <ul role="list" className="bb-logo-marquee flex w-max items-center">
            {[...logos, ...logos].map((logo, i) => (
              <li
                key={`${logo.name}-${i}`}
                aria-hidden={i >= logos.length}
                className="flex h-14 w-[clamp(8rem,14vw,11rem)] shrink-0 items-center justify-center px-4"
                title={logo.name}
              >
                {logo.src ? (
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={160}
                    height={44}
                    unoptimized
                    className={cn(
                      "w-auto max-w-[8.5rem] object-contain opacity-70 brightness-0 invert transition-opacity hover:opacity-100",
                      logo.imgClassName ?? "max-h-8",
                    )}
                  />
                ) : (
                  <span
                    aria-label={logo.name}
                    className="font-[var(--font-heading)] text-sm font-bold tracking-tight uppercase text-white/70"
                  >
                    {logo.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
