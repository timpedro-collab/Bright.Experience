/**
 * Root error boundary — last line of defence. Must include its own
 * <html> and <body> since the root layout may itself have thrown.
 */
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { BrandGlobalError } from "@/components/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    Sentry.captureException(error);
  }, [error]);

  return <BrandGlobalError reset={reset} digest={error.digest} />;
}
