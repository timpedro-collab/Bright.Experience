/** Track 1 entry page — browse bookable packages */
import type { Metadata } from "next";
import { getPackages } from "@/lib/queries/packages";
import { PackageTierCard } from "@/components/catalog/PackageTierCard";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Choose a Bright.Blue package, configure your machine and game, and check out in minutes.",
};

export default async function BookPage() {
  const packages = await getPackages();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-heading text-4xl font-bold text-foreground">
          Book Now
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose a package that fits your event. Configure your machine, game,
          and add-ons — then checkout in minutes.
        </p>
      </div>

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
          No packages available right now. Check back soon!
        </p>
      )}
    </section>
  );
}
