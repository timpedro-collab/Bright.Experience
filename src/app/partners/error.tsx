"use client";

import { useEffect } from "react";

import { BrandErrorState } from "@/components/brand";

export default function PartnersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PartnersErrorBoundary]", error);
  }, [error]);

  return <BrandErrorState reset={reset} digest={error.digest} />;
}
