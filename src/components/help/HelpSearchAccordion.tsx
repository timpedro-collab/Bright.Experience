/** Client-side search + accordion for the help center. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { EditorialEyebrow } from "@/components/brand";
import type { HelpArticle } from "@/content/help-articles";

interface GroupedArticles {
  category: string;
  articles: HelpArticle[];
}

interface HelpSearchAccordionProps {
  grouped: GroupedArticles[];
}

export function HelpSearchAccordion({ grouped }: HelpSearchAccordionProps) {
  const [query, setQuery] = useState("");
  const lowerQuery = query.toLowerCase().trim();

  const filtered = grouped
    .map((g) => ({
      ...g,
      articles: g.articles.filter(
        (a) =>
          !lowerQuery ||
          a.title.toLowerCase().includes(lowerQuery) ||
          a.body.toLowerCase().includes(lowerQuery),
      ),
    }))
    .filter((g) => g.articles.length > 0);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search help articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No articles match your search. Try a different term.
        </p>
      ) : (
        filtered.map((group) => (
          <div key={group.category} className="space-y-3">
            <EditorialEyebrow accent>{group.category}</EditorialEyebrow>
            <Accordion type="multiple" className="space-y-2">
              {group.articles.map((article) => (
                <AccordionItem
                  key={article.slug}
                  value={article.slug}
                  className="border border-border/30 rounded-[var(--radius-card)] px-4"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                    {article.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pb-4">
                    {article.body.slice(0, 200)}
                    {article.body.length > 200 && "…"}
                    <Link
                      href={`/help/${article.slug}`}
                      className="ml-2 text-[var(--color-bb-cobalt)] underline underline-offset-4"
                    >
                      Read more →
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}
    </>
  );
}
