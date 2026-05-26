/**
 * Catalog loading skeleton.
 *
 * Used by all catalog routes (Next bubbles up the closest `loading.tsx`).
 * Renders the same ridge hero and a 3-column grid of card skeletons so
 * the layout stays stable between pending and resolved states.
 */
import { Container, Section } from "@/components/ui/section";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export default function CatalogLoading() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(240px, 28vw, 320px)" }}
        >
          <RidgeArtwork
            seed="catalog::loading"
            lines={22}
            amplitude={70}
            className="text-[hsl(223,94%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-16 md:pt-20 pb-10">
          <EditorialEyebrow accent>Catalog</EditorialEyebrow>
          <div className="mt-2 h-12 w-2/3 rounded-md bg-white/[0.05] animate-pulse" />
          <div className="mt-3 h-5 w-1/2 rounded-md bg-white/[0.04] animate-pulse" />
        </Container>
      </section>
      <Section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <div className="aspect-[16/10] bg-white/[0.04] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-2/3 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-white/[0.04] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
