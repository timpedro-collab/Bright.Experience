/** Remove team member button with confirmation. */
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeTeamMember } from "@/app/actions/team";

export function TeamRemoveButton({ memberId }: { memberId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Remove this team member?")) return;
        startTransition(async () => {
          await removeTeamMember(memberId);
        });
      }}
    >
      {isPending ? "Removing…" : "Remove"}
    </Button>
  );
}
