/** Loading skeleton for the token-gated sponsor pitch / proof page. */
import { CapabilityLinkSkeleton } from "@/components/public/CapabilityLinkSkeleton";

export default function SponsorPitchLoading() {
  return <CapabilityLinkSkeleton metrics={3} cards={4} />;
}
