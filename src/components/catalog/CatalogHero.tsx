/** Catalog hero — editorial introduction with strong primary CTA */
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";

const STAT_PILLS = [
  { icon: Zap, label: "Live in 12 markets" },
  { icon: Trophy, label: "92% rebook rate" },
];

export function CatalogHero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(223,94%,53%,0.16),transparent_60%)]" />
      </div>

      <Container className="relative py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">
              Interactive activations
            </span>
          </div>
          <h1 className="text-display text-4xl text-balance text-foreground md:text-6xl lg:text-7xl">
            Capture 1,200+ leads at your next exhibition.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-balance max-w-2xl mx-auto md:text-xl">
            From booking and brand wrap through to live telemetry, we run the
            entire activation so your team can focus on the story.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" variant="brand" asChild>
              <Link href="/quiz">
                Find your match <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link href="#machines">Explore the catalog</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {STAT_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
