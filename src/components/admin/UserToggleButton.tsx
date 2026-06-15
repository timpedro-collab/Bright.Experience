/** Toggle a user's active status (internal admin only). */
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserActive } from "@/app/actions/admin-users";

interface UserToggleButtonProps {
  userId: string;
  isActive: boolean;
}

export function UserToggleButton({ userId, isActive }: UserToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleUserActive(userId, !isActive);
        });
      }}
    >
      {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
