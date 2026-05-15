/** Individual case study page — hero, description, stats, and CTA. */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCaseStudyBySlug } from "@/lib/queries/case-studies";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudyBySlug(slug);
  if (!cs) return { title: "Case study not found" };
  return {
    title: cs.title,
    description: cs.description ?? `Bright.Blue case study — ${cs.title}.`,
    openGraph: cs.hero_image_url
      ? { images: [{ url: cs.hero_image_url }] }
      : undefined,
  };
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params;
  const cs = await getCaseStudyBySlug(slug);
  if (!cs) notFound();

  const publishedDate = cs.published_at
    ? new Date(cs.published_at).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Button variant="ghost" size="sm" className="mb-6 gap-1.5" asChild>
        <Link href="/catalog/case-studies">
          <ArrowLeft className="h-3.5 w-3.5" /> All Case Studies
        </Link>
      </Button>

      <div className="relative overflow-hidden rounded-[var(--radius-card)]">
        {cs.hero_image_url ? (
          <div className="relative h-64 w-full md:h-96">
            <Image
              src={cs.hero_image_url}
              alt={cs.title}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-primary/20 via-card-dark to-brand-soft/10 md:h-96">
            <span className="text-heading text-4xl font-bold text-primary/30">
              {cs.title}
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {cs.event_type && (
            <Badge className="badge-blue">{cs.event_type}</Badge>
          )}
          {cs.location && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {cs.location}
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {publishedDate}
            </span>
          )}
        </div>

        <h1 className="text-heading text-3xl font-extrabold md:text-4xl">
          {cs.title}
        </h1>
        {cs.client_name && (
          <p className="text-lg text-muted-foreground">{cs.client_name}</p>
        )}
      </div>

      {/* Description */}
      {cs.description && (
        <Card className="mt-10">
          <CardContent className="prose prose-invert max-w-none p-6 leading-relaxed text-foreground/85">
            {cs.description}
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Want similar results for your brand?
        </p>
        <Button size="lg" className="mt-4" asChild>
          <Link href="/proposal">Get a Proposal</Link>
        </Button>
      </div>
    </div>
  );
}
