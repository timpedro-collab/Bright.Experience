/**
 * Book Now landing — browse bookable packages.
 *
 * Editorial Bright.Experience design language: ridge artwork backdrop,
 * tracked uppercase eyebrow, display-type headline, package tier grid.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Container } from "@/components/ui/section";
import { getPackages } from "@/lib/queries/packages";
import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Choose a Bright.Blue package, configure your machine and game, and submit your booking request in minutes.",
};

export default async function BookPage() {
  const packages = await getPackages();

  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="book-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(280px, 32vw, 380px)" }}
        >
          <RidgeArtwork
            seed="book::packages"
            lines={26}
            amplitude={80}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-20 md:pt-24 pb-10 text-center">
          <EditorialEyebrow accent className="mb-3 inline-block">
            Self-serve · Request in minutes
          </EditorialEyebrow>
          <h1
            id="book-hero"
            className="text-display text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]"
          >
            Book your activation.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg leading-relaxed">
            Choose a package that fits your event. Configure your machine,
            game, and add-ons — then send your booking request and we&apos;ll
            confirm the details.
          </p>
        </Container>
      </section>

      <Container className="pb-20">
        <div className="mb-8 flex justify-center">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Sparkles size={14} />
            Not sure? Take the quiz
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageTierCard
              key={pkg.slug}
              pkg={{
                name: pkg.name,
                slug: pkg.slug,
                tier: pkg.tier,
                durationDays: pkg.duration_days,
                featuresJson: pkg.features_json as string[] | undefined,
                isBookable: pkg.is_bookable,
              }}
              featured={pkg.tier === "premium"}
              ctaHref={`/book/configure?package=${pkg.slug}`}
              ctaLabel="Configure & book"
            />
          ))}
        </div>

        {packages.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No packages available right now. Check back soon.
          </p>
        )}
      </Container>
    </>
  );
}
