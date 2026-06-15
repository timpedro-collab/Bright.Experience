/** Package pricing tier card with CTA */
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageTierCardProps {
  pkg: {
    name: string;
    slug: string;
    tier: string;
    basePrice?: number | null;
    featuresJson?: string[];
    isBookable: boolean;
  };
  featured?: boolean;
}

function formatPrice(pence?: number | null): string {
  if (!pence) return "Get Proposal";
  return `£${(pence / 100).toLocaleString("en-GB")}`;
}

export function PackageTierCard({ pkg, featured = false }: PackageTierCardProps) {
  const features = pkg.featuresJson ?? [];

  return (
    <Card className={cn(
      "relative overflow-hidden",
      featured && "border-brand/40 shadow-[0_0_30px_-10px_hsl(230,93%,53%,0.3)]"
    )}>
      {featured && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-brand to-brand-soft" />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px] uppercase">
            {pkg.tier}
          </Badge>
        </div>
        <CardTitle className="text-lg">{pkg.name}</CardTitle>
        <p className="text-2xl font-bold text-heading text-foreground mt-1">
          {formatPrice(pkg.basePrice)}
          {pkg.basePrice && <span className="text-sm font-normal text-muted-foreground">/event</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
        <Button className="w-full" variant={featured ? "default" : "outline"} asChild>
          <Link href={pkg.isBookable ? `/book/configure?package=${pkg.slug}` : "/proposal"}>
            {pkg.isBookable ? "Book Now" : "Get Proposal"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
