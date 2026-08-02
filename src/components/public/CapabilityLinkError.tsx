/**
 * Error boundary body shared by the three public capability-URL surfaces
 * (sponsor pitch, proposal, post-event report).
 *
 * These pages are reached by an unauthenticated recipient holding a token, so
 * the fallback has to do two things at once: report the failure to us, and say
 * nothing about whether the token is valid. The copy is deliberately about the
 * page not loading, never about the link being wrong.
 */
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { BrandErrorState } from "@/components/brand";

export function CapabilityLinkError({
  error,
  reset,
  surface,
  noun,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Segment name, used for the log prefix and the artwork seed. */
  surface: string;
  /** What the recipient thinks they opened, e.g. "proposal". */
  noun: string;
}) {
  useEffect(() => {
    console.error(`[${surface}/error]`, error);
    Sentry.captureException(error, { tags: { surface } });
  }, [error, surface]);

  return (
    <BrandErrorState
      reset={reset}
      digest={error.digest}
      seed={`${surface}::error`}
      title={`We couldn't load this ${noun}`}
      subtitle="The link is fine — something on our side didn't respond."
      body="Try again in a moment. If it keeps happening, reply to the email that brought you here and quote the reference below."
    />
  );
}
