/**
 * Invitation footer for public artefacts — an invitation, not a credit.
 * "Want results like this at your event?" outperforms "Powered by" because
 * it speaks to the reader, not about us. UTM-tagged per artefact so the
 * loop-pulse dashboard can measure which surfaces convert.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  invitationHref,
  type InvitationArtifact,
} from "@/lib/loop/invitation";

interface InvitationFooterProps {
  artifact: InvitationArtifact;
  /** Referring event name — personalises the landing page. */
  fromEvent?: string | null;
  className?: string;
}

export function InvitationFooter({
  artifact,
  fromEvent,
  className,
}: InvitationFooterProps) {
  return (
    <div className={cn("text-center", className)}>
      <Link
        href={invitationHref(artifact, { fromEvent })}
        className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
      >
        Want results like this at your event?
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
