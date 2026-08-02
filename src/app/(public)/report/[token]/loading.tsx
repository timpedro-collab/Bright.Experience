/** Loading skeleton for the share-token-gated post-event report. */
import { CapabilityLinkSkeleton } from "@/components/public/CapabilityLinkSkeleton";

export default function ReportLoading() {
  return <CapabilityLinkSkeleton metrics={4} cards={3} />;
}
