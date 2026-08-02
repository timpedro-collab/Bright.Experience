/**
 * Organizer portal error boundary.
 *
 * Without this, anything thrown in the organizer tree fell through to the root
 * boundary, which meant an organizer lost the portal chrome and got a generic
 * page. The digest is shown so support can match the report in Sentry.
 */
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { BrandErrorState } from "@/components/brand";

export default function OrganizerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[organizers/error]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <BrandErrorState
      reset={reset}
      digest={error.digest}
      seed="organizers::error"
      title="Couldn't load your portal"
      subtitle="Something went wrong on our side, not yours."
      body="Try again in a moment. If it keeps happening, send us the error reference below and we'll pick it up."
    />
  );
}
