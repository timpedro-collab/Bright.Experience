"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { BrandErrorState } from "@/components/brand";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StudioErrorBoundary]", error);
    Sentry.captureException(error);
  }, [error]);

  return <BrandErrorState reset={reset} digest={error.digest} />;
}
