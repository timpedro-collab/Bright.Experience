/** Package detail page — features, add-ons, and a clear primary CTA */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPackageBySlug } from "@/lib/queries/packages";
import { formatFeatureLabel, formatDurationLabel } from "@/lib/catalog-format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: "Package not found" };
  return {
    title: pkg.name,
    description: `Bright.Blue ${pkg.tier} package — ${pkg.duration_days ? `${pkg.duration_days} days` : "bespoke duration"}`,
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const features = (pkg.features_json as string[]) ?? [];
  const addons =
    (pkg.package_addons as {
      id: string;
      name: string;
      description?: string;
    }[]) ?? [];
  const parentMachine = pkg.machines as { name?: string; slug?: string } | null;

  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <nav className="mb-4 text-xs text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground">Catalog</Link>
            <span className="mx-2">/</span>
            <Link href="/catalog/packages" className="hover:text-foreground">Packages</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground/80">{pkg.name}</span>
          </nav>
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
            <div>
              <Badge variant="secondary" className="mb-3">{pkg.tier} tier</Badge>
              <h1 className="text-display text-4xl md:text-5xl font-bold text-foreground">
                {pkg.name}
              </h1>
              {parentMachine && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Built on{" "}
                  <Link
                    href={`/catalog/machines/${parentMachine.slug}`}
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                  >
                    {parentMachine.name}
                  </Link>
                </p>
              )}
              {formatDurationLabel(pkg.duration_days) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDurationLabel(pkg.duration_days)}
                </p>
              )}
              {pkg.description && (
                <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                  {pkg.description}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-2">
                <Button asChild variant="brand" size="lg">
                  <Link href={`/proposal?package=${pkg.slug}`}>
                    Request a quote <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link href="/catalog/packages">Compare packages</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-6 backdrop-blur-md">
              <p className="text-overline text-muted-foreground mb-3">What&apos;s included</p>
              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground">Details available on request.</p>
              ) : (
                <ul className="space-y-2.5">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-success" />
                      <span>{formatFeatureLabel(feature)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {addons.length > 0 && (
        <Section>
          <Container>
            <h2 className="text-heading text-2xl font-semibold md:text-3xl">Add-ons</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Boost this package with optional Bright.Blue upgrades.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,56%,11%,0.55)] p-5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-heading text-base font-semibold">{addon.name}</h3>
                  </div>
                  {addon.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {addon.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
