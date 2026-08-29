/** Package tier card — details-forward, with a "Request a quote" CTA */
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFeatureLabel, formatDurationLabel } from "@/lib/catalog-format";

interface PackageTierCardProps {
  pkg: {
    name: string;
    slug: string;
    tier: string;
    durationDays?: number | null;
    featuresJson?: string[];
    isBookable: boolean;
  };
  featured?: boolean;
  /** Override the CTA. Defaults to the "Request a quote" intake flow. */
  ctaHref?: string;
  ctaLabel?: string;
}

export function PackageTierCard({
  pkg,
  featured = false,
  ctaHref,
  ctaLabel,
}: PackageTierCardProps) {
  const features = pkg.featuresJson ?? [];
  const duration = formatDurationLabel(pkg.durationDays);
  const href = ctaHref ?? `/proposal?package=${pkg.slug}`;
  const label = ctaLabel ?? "Request a quote";

  return (
    <Card className={cn(
      "relative flex flex-col overflow-hidden",
      featured && "border-brand/40 shadow-[0_0_30px_-10px_color-mix(in_srgb,var(--color-bb-cobalt)_30%,transparent)]"
    )}>
      {featured && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-brand to-brand-soft" />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase">
            {pkg.tier}
          </Badge>
          {featured && (
            <Badge variant="default" className="text-[10px] uppercase">
              Most popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{pkg.name}</CardTitle>
        {duration && (
          <p className="mt-1 text-sm text-muted-foreground">{duration}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                {formatFeatureLabel(feature)}
              </li>
            ))}
          </ul>
        )}
        <Button
          className="mt-auto w-full"
          variant={featured ? "default" : "outline"}
          asChild
        >
          <Link href={href}>
            {label} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
