/** Quiet snooze control for task rows on the internal home focus list. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlarmClock } from "lucide-react";
import { toast } from "sonner";

import { snoozeTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SnoozeTaskControlProps {
  taskId: string;
}

function snoozeOneDayFromNow(): string {
  const until = new Date();
  until.setDate(until.getDate() + 1);
  return until.toISOString();
}

/** Next Monday at 09:00 local — if today is Monday, the following Monday. */
function snoozeUntilMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysToAdd = day === 1 ? 7 : (8 - day) % 7 || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + daysToAdd);
  monday.setHours(9, 0, 0, 0);
  return monday.toISOString();
}

export function SnoozeTaskControl({ taskId }: SnoozeTaskControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSnooze(until: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await snoozeTask(taskId, until);
      if (result.success) {
        toast.success("Snoozed — we'll remind you when it's back.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label="Snooze task"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <AlarmClock className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Snooze</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => handleSnooze(snoozeOneDayFromNow())}>
          Snooze 1 day
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSnooze(snoozeUntilMonday())}>
          Snooze until Monday
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
