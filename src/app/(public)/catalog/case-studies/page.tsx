/** Case studies listing page — grid of all published case studies. */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStudyCard } from "@/components/catalog/CaseStudyCard";
import { getCaseStudies } from "@/lib/queries/case-studies";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real activations, real results. Browse Bright.Blue case studies from train stations, shopping centres, and brand launches.",
};

export default async function CaseStudiesPage() {
  const caseStudies = await getCaseStudies();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Button variant="ghost" size="sm" className="mb-6 gap-1.5" asChild>
        <Link href="/catalog">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
        </Link>
      </Button>

      <h1 className="text-heading text-4xl font-extrabold">Case Studies</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        See how brands have used Bright.Blue activations to drive engagement,
        generate leads, and create unforgettable experiences.
      </p>

      {caseStudies.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <CaseStudyCard key={cs.slug} caseStudy={cs} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-muted-foreground">
          Case studies coming soon.
        </p>
      )}
    </div>
  );
}
