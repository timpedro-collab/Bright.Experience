/** Individual case study page — hero, description, stats, and CTA. */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MediaGallery, type MediaItem } from "@/components/catalog/MediaGallery";
import { formatDateMedium } from "@/lib/dates";
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

  const details = parseDetails(
    (cs as { details_json?: unknown }).details_json ?? null,
  );

  const publishedDate = cs.published_at
    ? formatDateMedium(cs.published_at)
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
            <Badge variant="info">{cs.event_type}</Badge>
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
        {details?.subtitle ? (
          <p className="text-lg text-muted-foreground">{details.subtitle}</p>
        ) : (
          cs.client_name && (
            <p className="text-lg text-muted-foreground">{cs.client_name}</p>
          )
        )}
        {details?.reportUrl && (
          <Button variant="outline" size="sm" className="mt-1 gap-2" asChild>
            <a href={details.reportUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-3.5 w-3.5" /> View the full case study
            </a>
          </Button>
        )}
      </div>

      {/* Stats (rendered from stats_json if present) */}
      <StatsRow stats={cs.stats_json as Record<string, unknown> | null} />

      {/* Description */}
      {cs.description && (
        <Card className="mt-10">
          <CardContent className="prose prose-invert max-w-none p-6 leading-relaxed text-foreground/85">
            {cs.description}
          </CardContent>
        </Card>
      )}

      {/* Activation details */}
      {details && <ActivationDetails details={details} />}

      {/* Gallery */}
      {(() => {
        const raw = (cs.gallery_urls as string[] | null) ?? [];
        const galleryItems: MediaItem[] = raw.map((url) => ({
          url,
          type: (url.endsWith(".mp4") || url.endsWith(".webm") ? "video" : "image") as "video" | "image",
        }));
        if (galleryItems.length === 0) return null;
        return (
          <div className="mt-10">
            <p className="text-overline text-muted-foreground mb-4">Gallery</p>
            <MediaGallery items={galleryItems} />
          </div>
        );
      })()}

      {/* Testimonial */}
      {cs.testimonial_quote && (
        <Card className="mt-10 border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-8">
            <blockquote className="text-display text-xl text-foreground md:text-2xl leading-snug">
              &ldquo;{cs.testimonial_quote}&rdquo;
            </blockquote>
            {cs.testimonial_author && (
              <p className="mt-4 text-sm text-muted-foreground">
                — {cs.testimonial_author}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Want similar results for your brand?
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button size="lg" variant="brand" asChild>
            <Link href="/proposal">Get a proposal</Link>
          </Button>
          <Button size="lg" variant="glass" asChild>
            <Link href="/quiz">Take the quiz</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function humanizeStatKey(key: string): string {
  return key
    .replace(/Pct$/, "")
    .replace(/Sec$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bnps\b/i, "NPS")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Render a stat value with thousands grouping and a unit suffix where helpful. */
function formatStatValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    if (key.endsWith("Pct")) return `${value}%`;
    if (/nps/i.test(key)) return `${value} / 5`;
    if (key.endsWith("Sec")) return `${value}s`;
    return value.toLocaleString("en-US");
  }
  return String(value);
}

interface ActivationDetailsData {
  subtitle?: string;
  reportUrl?: string;
  performance?: { value: string; label: string }[];
  demographics?: {
    gender?: { label: string; pct: number }[];
    age?: { label: string; pct: number }[];
  };
  footprint?: { date: string; location: string }[];
  insight?: string;
  note?: string;
}

/** Defensively read the optional structured details blob off a case study. */
function parseDetails(raw: unknown): ActivationDetailsData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as ActivationDetailsData;
  const hasContent =
    d.performance?.length ||
    d.demographics?.gender?.length ||
    d.demographics?.age?.length ||
    d.footprint?.length ||
    d.insight ||
    d.note ||
    d.subtitle ||
    d.reportUrl;
  return hasContent ? d : null;
}

/** Horizontal labelled bar used for demographic breakdowns. */
function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
        {pct}%
      </span>
    </div>
  );
}

function ActivationDetails({ details }: { details: ActivationDetailsData }) {
  const { performance, demographics, footprint, insight, note } = details;
  return (
    <div className="mt-12 space-y-10">
      {/* Activation performance */}
      {performance && performance.length > 0 && (
        <section>
          <p className="text-overline text-muted-foreground mb-4">
            Activation performance
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {performance.map((p) => (
              <div
                key={p.label}
                className="rounded-[var(--radius-card)] border border-border/30 bg-card/40 p-5"
              >
                <p className="text-heading text-2xl font-bold text-primary tabular-nums">
                  {p.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {p.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Demographics */}
      {(demographics?.gender?.length || demographics?.age?.length) && (
        <section>
          <p className="text-overline text-muted-foreground mb-4">
            Who engaged
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {demographics?.gender && demographics.gender.length > 0 && (
              <Card>
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-semibold text-foreground">
                    Gender split
                  </p>
                  {demographics.gender.map((g) => (
                    <BarRow key={g.label} label={g.label} pct={g.pct} />
                  ))}
                </CardContent>
              </Card>
            )}
            {demographics?.age && demographics.age.length > 0 && (
              <Card>
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-semibold text-foreground">
                    Age distribution
                  </p>
                  {demographics.age.map((a) => (
                    <BarRow key={a.label} label={a.label} pct={a.pct} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Footprint */}
      {footprint && footprint.length > 0 && (
        <section>
          <p className="text-overline text-muted-foreground mb-4">
            Activation footprint
          </p>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Activation location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {footprint.map((row) => (
                    <tr
                      key={`${row.date}-${row.location}`}
                      className="border-b border-border/20 last:border-0"
                    >
                      <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                        {row.date}
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {row.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Key insight */}
      {(insight || note) && (
        <section>
          <p className="text-overline text-muted-foreground mb-4">
            Key insights
          </p>
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="space-y-4 p-6 md:p-8">
              {insight && (
                <p className="text-base leading-relaxed text-foreground/90">
                  {insight}
                </p>
              )}
              {note && (
                <p className="rounded-[var(--radius-card)] border border-border/30 bg-card/40 p-4 text-sm leading-relaxed text-muted-foreground">
                  {note}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function StatsRow({ stats }: { stats: Record<string, unknown> | null }) {
  if (!stats || typeof stats !== "object") return null;
  const entries = Object.entries(stats).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-[var(--radius-card)] border border-border/30 bg-card/40 p-5"
        >
          <p className="text-heading text-2xl font-bold text-primary tabular-nums">
            {formatStatValue(key, value)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {humanizeStatKey(key)}
          </p>
        </div>
      ))}
    </div>
  );
}
