/** Internal Approve/Reject controls for a pending team-member request. */
"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { approveTeamMember, rejectTeamMember } from "@/app/actions/team";

export function TeamApprovalButtons({ memberId }: { memberId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <span className="ml-auto inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveTeamMember(memberId);
          })
        }
      >
        {isPending ? "…" : "Approve"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Reject this team member request?")) return;
          startTransition(async () => {
            await rejectTeamMember(memberId);
          });
        }}
      >
        Reject
      </Button>
    </span>
  );
}
