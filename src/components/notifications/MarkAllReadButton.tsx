"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { markAllRead } from "@/app/actions/notifications";

/**
 * Small client wrapper around the `markAllRead` server action.
 *
 * Kept as its own component so the notifications page can stay a server
 * component while still exposing a reactive "Mark all read" affordance.
 */
export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="glass"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllRead();
          router.refresh();
        })
      }
    >
      <CheckCheck className="h-4 w-4" /> Mark all read
    </Button>
  );
}
