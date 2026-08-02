/** Loading skeleton for the shareable proposal page. */
import { CapabilityLinkSkeleton } from "@/components/public/CapabilityLinkSkeleton";

export default function ProposalLoading() {
  return <CapabilityLinkSkeleton metrics={2} cards={4} />;
}
