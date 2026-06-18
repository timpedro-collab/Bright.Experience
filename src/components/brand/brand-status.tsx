/**
 * Brand status kit — shared chrome for full-page status moments (errors,
 * permission walls, empty boundaries).
 *
 * Two pieces:
 *   - `BrandStatusShell`: composes the EditionShell ridge chrome so error and
 *     boundary screens look like the rest of the product (light by default,
 *     not an off-brand deep-ink panel). Use inside `error.tsx` boundaries.
 *   - `BrandGlobalError`: a fully self-contained, inline-styled screen for the
 *     root `global-error.tsx`, which renders its own <html>/<body> because the
 *     root layout (and its CSS variables) may itself have thrown.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "./edition-shell";
import { Button } from "@/components/ui/button";

interface BrandStatusShellProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Centered body copy under the hero. */
  body?: React.ReactNode;
  /** A small monospace reference line (e.g. an error digest). */
  reference?: string;
  /** Action buttons rendered centered below the body. */
  actions?: React.ReactNode;
  /** Ridge seed so each surface gets its own deterministic artwork. */
  seed?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function BrandStatusShell({
  eyebrow,
  title,
  subtitle,
  body,
  reference,
  actions,
  seed = "status",
  breadcrumbs = [{ label: "Home", href: "/" }],
}: BrandStatusShellProps) {
  return (
    <EditionShell>
      <EditionChrome breadcrumbs={breadcrumbs} />
      <RidgeHero seed={seed} eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <EditionBody>
        <section className="flex flex-col items-center py-12 text-center">
          {body && (
            <p className="mb-6 max-w-md text-sm text-muted-foreground">{body}</p>
          )}
          {reference && (
            <p className="mb-6 text-xs tabular-nums text-muted-foreground">
              Reference: {reference}
            </p>
          )}
          {actions && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {actions}
            </div>
          )}
        </section>
      </EditionBody>
      <EditionFooter />
    </EditionShell>
  );
}

/**
 * Convenience error boundary body used by `error.tsx` files. Renders a brand
 * status shell with a "Try again" + "Back to home" action pair.
 */
export function BrandErrorState({
  reset,
  digest,
  title = "Something went wrong",
  subtitle = "An unexpected error occurred on this page.",
  body = "If this keeps happening, contact your Bright.Blue account manager.",
  seed = "error",
  homeHref = "/",
}: {
  reset?: () => void;
  digest?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  seed?: string;
  homeHref?: string;
}) {
  return (
    <BrandStatusShell
      eyebrow="Error"
      title={title}
      subtitle={subtitle}
      body={body}
      reference={digest}
      seed={seed}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Error" }]}
      actions={
        <>
          {reset && (
            <Button variant="brand" onClick={reset}>
              <RefreshCw size={14} />
              Try again
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={homeHref}>
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </Button>
        </>
      }
    />
  );
}

/**
 * Root global error — self-contained, inline-styled, light. Renders its own
 * <html>/<body> because the root layout may have thrown, so app CSS variables
 * are not guaranteed to be present.
 */
export function BrandGlobalError({
  reset,
  digest,
}: {
  reset: () => void;
  digest?: string;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f8fc",
          color: "#0f1729",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: "0 24px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 24px",
              borderRadius: 16,
              border: "1px solid rgba(220,38,38,0.25)",
              backgroundColor: "rgba(220,38,38,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            <AlertTriangle size={28} color="#dc2626" />
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            An unexpected error occurred. If this keeps happening, contact your
            Bright.Blue account manager.
          </p>
          {digest && (
            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Error reference: {digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <button
              onClick={reset}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                border: "none",
                background:
                  "linear-gradient(135deg, hsl(230,93%,53%), hsl(230,93%,60%))",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* Hard navigation on purpose — the app may be in a broken state. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid rgba(15,23,41,0.15)",
                background: "transparent",
                color: "#0f1729",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
