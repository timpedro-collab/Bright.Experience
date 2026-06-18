/**
 * Catalog error boundary.
 *
 * Catches anything thrown inside the catalog tree (query failures,
 * unexpected exceptions, etc) and offers a retry. We surface no internal
 * detail to the visitor — just a friendly fallback in the editorial voice.
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { EditorialEyebrow } from "@/components/brand";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // STUB: send to Sentry / observability once wired (Phase 8)
    console.error("[catalog/error]", error);
  }, [error]);

  return (
    <Section spacing="lg">
      <Container size="sm">
        <div className="rounded-[var(--radius-card)] border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <EditorialEyebrow>Something didn&apos;t load</EditorialEyebrow>
          <h1 className="mt-2 text-display text-2xl text-foreground md:text-3xl">
            We couldn&apos;t reach the catalog right now.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Try again in a moment — and if it keeps happening, ping us at{" "}
            <a
              href="mailto:hello@brightblue.co.uk"
              className="text-foreground underline underline-offset-4"
            >
              hello@brightblue.co.uk
            </a>
            .
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={reset} variant="brand">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
