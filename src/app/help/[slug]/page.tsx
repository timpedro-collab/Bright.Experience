/** Individual help article page — renders markdown body with feedback CTA. */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getArticleBySlug, HELP_ARTICLES } from "@/content/help-articles";

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return { title: article?.title ?? "Help" };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return notFound();

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Help", href: "/help" },
          { label: article.title },
        ]}
      />
      <RidgeHero
        seed={`help::${article.slug}`}
        eyebrow={article.category}
        title={article.title}
      />
      <EditionBody>
        <article className="max-w-2xl mx-auto py-10 space-y-8">
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
            {article.body}
          </div>

          <div className="border border-border/30 rounded-[var(--radius-card)] p-6 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">
              Was this helpful?
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ThumbsUp size={14} /> Yes
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ThumbsDown size={14} /> No
              </Button>
            </div>
          </div>

          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={14} /> Back to Help Center
          </Link>
        </article>
      </EditionBody>
      <EditionFooter
        rightSlot={
          <Link href="/help" className="hover:opacity-80 transition-opacity">
            Help center →
          </Link>
        }
      />
    </EditionShell>
  );
}
