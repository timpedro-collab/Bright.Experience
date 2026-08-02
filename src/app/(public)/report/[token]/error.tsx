/** Error boundary for the share-token-gated post-event report. */
"use client";

import { CapabilityLinkError } from "@/components/public/CapabilityLinkError";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CapabilityLinkError
      error={error}
      reset={reset}
      surface="report"
      noun="report"
    />
  );
}
