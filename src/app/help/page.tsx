/** Searchable FAQ / help center — grouped by category with accordion sections. */
import Link from "next/link";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { HelpSearchAccordion } from "@/components/help/HelpSearchAccordion";

import { HELP_ARTICLES, HELP_CATEGORIES } from "@/content/help-articles";

export const metadata = { title: "Help Center" };

export default function HelpPage() {
  const grouped = HELP_CATEGORIES.map((cat) => ({
    category: cat,
    articles: HELP_ARTICLES.filter((a) => a.category === cat),
  })).filter((g) => g.articles.length > 0);

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Help" }]}
      />
      <RidgeHero
        seed="help::center"
        eyebrow="Help center"
        title="How can we help?"
        subtitle="Browse frequently asked questions or search for a topic."
      />
      <EditionBody>
        <section className="max-w-3xl mx-auto py-10 space-y-10">
          <HelpSearchAccordion grouped={grouped} />
        </section>
      </EditionBody>
      <EditionFooter
        rightSlot={
          <Link href="/" className="hover:opacity-80 transition-opacity">
            Back to home →
          </Link>
        }
      />
    </EditionShell>
  );
}
