"use client";

/**
 * Take a unit off a show.
 *
 * Disabled while a sponsor slot points at the unit: the server refuses it
 * anyway, and a button that explains itself beats one that fails on click.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { releaseMachineFromShow } from "@/app/actions/organizer-admin";

interface ReleaseMachineButtonProps {
  machineInstanceId: string;
  serialNumber: string;
  /** A sponsor slot on this unit blocks the release. */
  blockedBySponsor?: string | null;
  blocked?: boolean;
}

export function ReleaseMachineButton({
  machineInstanceId,
  serialNumber,
  blockedBySponsor,
  blocked = false,
}: ReleaseMachineButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (blocked) {
    return (
      <span className="text-[0.65rem] text-muted-foreground">
        {blockedBySponsor ? `Sold to ${blockedBySponsor}` : "Sponsor slot open"}
      </span>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const result = await releaseMachineFromShow(machineInstanceId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${serialNumber} released`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Release ${serialNumber}`}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
      Release
    </Button>
  );
}
