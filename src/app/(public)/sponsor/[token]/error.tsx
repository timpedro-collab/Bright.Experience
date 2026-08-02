/** Error boundary for the token-gated sponsor pitch / proof page. */
"use client";

import { CapabilityLinkError } from "@/components/public/CapabilityLinkError";

export default function SponsorPitchError({
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
      surface="sponsor"
      noun="sponsor pack"
    />
  );
}
