/** Error boundary for the shareable proposal page. */
"use client";

import { CapabilityLinkError } from "@/components/public/CapabilityLinkError";

export default function ProposalError({
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
      surface="proposal"
      noun="proposal"
    />
  );
}
