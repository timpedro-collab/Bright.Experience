"use client";

import { useEffect } from "react";

import { BrandErrorState } from "@/components/brand";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SettingsErrorBoundary]", error);
  }, [error]);

  return <BrandErrorState reset={reset} digest={error.digest} />;
}
