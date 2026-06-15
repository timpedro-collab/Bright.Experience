/** LogosStrip — monochrome social proof row under the hero.
 *
 * Renders a "Trusted by" overline followed by a row of client logos.
 * Falls back to a monogram glyph when no logo src is provided.
 * Drop real SVGs into /public/logos/* and pass `src` to upgrade.
 */
import Image from "next/image";

import { Container, Section } from "@/components/ui/section";

interface LogoEntry {
  name: string;
  /** Optional SVG/PNG src. Falls back to a monogram. */
  src?: string;
}

const DEFAULT_LOGOS: LogoEntry[] = [
  { name: "Costa Coffee" },
  { name: "Lucozade" },
  { name: "Red Bull" },
  { name: "Pepsi" },
  { name: "Porsche" },
  { name: "Suntory" },
];

interface LogosStripProps {
  logos?: LogoEntry[];
  overline?: string;
}

export function LogosStrip({
  logos = DEFAULT_LOGOS,
  overline = "Trusted by",
}: LogosStripProps) {
  return (
    <Section spacing="md" className="border-t border-white/[0.06]">
      <Container>
        <p className="text-overline text-muted-foreground text-center">
          {overline}
        </p>
        <ul
          role="list"
          className="mt-6 grid grid-cols-3 items-center gap-x-8 gap-y-6 sm:grid-cols-6"
        >
          {logos.slice(0, 6).map((logo) => (
            <li
              key={logo.name}
              className="flex h-10 items-center justify-center text-muted-foreground/70 transition-opacity hover:text-foreground"
              title={logo.name}
            >
              {logo.src ? (
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
                />
              ) : (
                <span
                  aria-label={logo.name}
                  className="font-[var(--font-heading)] text-sm font-bold tracking-tight uppercase"
                >
                  {logo.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
