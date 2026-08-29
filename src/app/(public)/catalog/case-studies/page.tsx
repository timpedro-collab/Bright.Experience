/** Case studies listing page — grid of all published case studies. */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { CaseStudyCard } from "@/components/catalog/CaseStudyCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";
import { getCaseStudies } from "@/lib/queries/case-studies";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real activations, real results. Browse Bright.Blue case studies from train stations, shopping centres, and brand launches.",
};

export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const caseStudies = await getCaseStudies();

  // Build the event-type filter set from the data we actually have, so the
  // pill row never offers a filter that nukes the grid.
  const eventTypes = Array.from(
    new Set(
      caseStudies
        .map((c) => (c.event_type ?? "").toLowerCase().trim())
        .filter(Boolean)
    )
  ).sort();
  const filterOptions = [
    { label: "All", value: "" },
    ...eventTypes.map((t) => ({
      label: t.charAt(0).toUpperCase() + t.slice(1),
      value: t,
    })),
  ];

  const filtered =
    filter && eventTypes.includes(filter.toLowerCase())
      ? caseStudies.filter(
          (c) => (c.event_type ?? "").toLowerCase() === filter.toLowerCase()
        )
      : caseStudies;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(240px, 28vw, 320px)" }}
        >
          <RidgeArtwork
            seed="catalog::case-studies"
            lines={22}
            amplitude={70}
            className="text-bb-cobalt"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-16 md:pt-20 pb-10">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-overline text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Catalogue
          </Link>
          <EditorialEyebrow accent>The proof</EditorialEyebrow>
          <h1 className="text-display mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.1] text-foreground">
            Case studies.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
            Real activations, real results. See how brands have used
            Bright.Blue to drive engagement, generate leads, and create
            unforgettable experiences.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          {filterOptions.length > 1 && (
            <div className="mb-8">
              <CatalogFilters
                param="filter"
                options={filterOptions}
                label="Filter case studies by event type"
              />
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cs, i) => (
                <CaseStudyCard
                  key={cs.slug}
                  caseStudy={{
                    title: cs.title,
                    slug: cs.slug,
                    clientName: cs.client_name ?? undefined,
                    location: cs.location ?? undefined,
                    heroImageUrl: cs.hero_image_url ?? undefined,
                    statsJson:
                      (cs.stats_json as Record<string, unknown>) ?? undefined,
                  }}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {filter
                ? `No case studies match "${filter}" yet — try removing the filter.`
                : "Case studies coming soon."}
            </p>
          )}
        </Container>
      </Section>
    </>
  );
}
