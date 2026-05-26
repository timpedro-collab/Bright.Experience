/**
 * Book Now landing — browse bookable packages.
 *
 * Editorial Bright.Experience design language: ridge artwork backdrop,
 * tracked uppercase eyebrow, display-type headline, package tier grid.
 */

import type { Metadata } from "next";

import { Container } from "@/components/ui/section";
import { getPackages } from "@/lib/queries/packages";
import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Choose a Bright.Blue package, configure your machine and game, and check out in minutes.",
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
            className="text-[hsl(223,94%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-20 md:pt-24 pb-10 text-center">
          <EditorialEyebrow accent className="mb-3 inline-block">
            Self-serve · Booked in minutes
          </EditorialEyebrow>
          <h1
            id="book-hero"
            className="text-display text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]"
          >
            Book your activation.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg leading-relaxed">
            Choose a package that fits your event. Configure your machine,
            game, and add-ons — then checkout in minutes.
          </p>
        </Container>
      </section>

      <Container className="pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageTierCard
              key={pkg.slug}
              pkg={{
                name: pkg.name,
                slug: pkg.slug,
                tier: pkg.tier,
                basePrice: pkg.base_price,
                featuresJson: pkg.features_json as string[] | undefined,
                isBookable: pkg.is_bookable,
              }}
              featured={pkg.tier === "premium"}
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
